import { createServerFn } from "@tanstack/react-start";
import { connectDB } from "@/server/db/connection";
import { Order, Product } from "@/server/db/models";

// ─── Create order ───
export const createOrder = createServerFn({ method: "POST" })
  .validator(
    (data: {
      items: {
        productId: string;
        quantity: number;
        variantSku?: string;
      }[];
      shippingAddress: {
        fullName: string;
        phone: string;
        division: string;
        district: string;
        area: string;
        streetAddress: string;
        postalCode?: string;
      };
      paymentMethod: string;
      couponCode?: string;
      deliveryNotes?: string;
      userId?: string;
      guestEmail?: string;
      guestPhone?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    await connectDB();

    // Fetch products and build order items
    const orderItems = [];
    let subtotal = 0;

    for (const item of data.items) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(item.productId);
      const product = isObjectId
        ? await Product.findById(item.productId).lean()
        : await Product.findOne({ slug: item.productId }).lean();

      if (!product) throw new Error(`Product ${item.productId} not found`);

      let price = product.price;
      let variantInfo = undefined;

      if (item.variantSku && product.variants?.length) {
        const variant = product.variants.find((v) => v.sku === item.variantSku);
        if (variant) {
          price = variant.price;
          variantInfo = {
            sku: variant.sku,
            color: variant.color,
            size: variant.size,
          };
        }
      }

      const total = price * item.quantity;
      subtotal += total;

      orderItems.push({
        product: product._id,
        productName: product.name,
        productImage: product.images?.[0] || "/placeholder.svg",
        variant: variantInfo,
        price,
        quantity: item.quantity,
        total,
      });

      // Decrement stock
      if (product.trackInventory) {
        await Product.updateOne(
          { _id: product._id },
          {
            $inc: {
              stock: -item.quantity,
              totalSold: item.quantity,
            },
          },
        );
      }
    }

    // Calculate shipping
    const isDhaka =
      data.shippingAddress.division === "Dhaka" && data.shippingAddress.district === "Dhaka";
    const shippingCost = subtotal >= 2000 ? 0 : isDhaka ? 70 : 120;

    const total = subtotal + shippingCost;

    // Only set user if it's a valid MongoDB ObjectId (24-char hex)
    const isValidObjectId = data.userId && /^[0-9a-fA-F]{24}$/.test(data.userId);

    const order = await Order.create({
      user: isValidObjectId ? data.userId : undefined,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone,
      items: orderItems,
      subtotal,
      shippingCost,
      tax: 0,
      discount: 0,
      couponCode: data.couponCode,
      total,
      paymentMethod: data.paymentMethod,
      shippingAddress: data.shippingAddress,
      billingAddress: data.shippingAddress,
      deliveryNotes: data.deliveryNotes,
    });

    return JSON.parse(JSON.stringify(order.toJSON()));
  });

// ─── Get order by ID ───
export const getOrderById = createServerFn({ method: "GET" })
  .validator((orderId: string) => orderId)
  .handler(async ({ data: orderId }) => {
    await connectDB();
    const order = await Order.findById(orderId).populate("user", "name email").lean();
    return order ? JSON.parse(JSON.stringify(order)) : null;
  });

// ─── Get order by order number ───
export const getOrderByNumber = createServerFn({ method: "GET" })
  .validator((orderNumber: string) => orderNumber)
  .handler(async ({ data: orderNumber }) => {
    await connectDB();
    const order = await Order.findOne({ orderNumber }).lean();
    return order ? JSON.parse(JSON.stringify(order)) : null;
  });

// ─── Get user orders ───
export const getUserOrders = createServerFn({ method: "GET" })
  .validator((data: { userId: string; page?: number; pageSize?: number }) => data)
  .handler(async ({ data }) => {
    await connectDB();
    const { userId, page = 1, pageSize = 10 } = data;
    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      Order.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
      Order.countDocuments({ user: userId }),
    ]);

    return {
      items: JSON.parse(JSON.stringify(orders)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });

// ─── Update order status (Admin) ───
export const updateOrderStatus = createServerFn({ method: "POST" })
  .validator(
    (data: {
      orderId: string;
      status: string;
      trackingId?: string;
      courierName?: string;
      notes?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    await connectDB();
    const updates: Record<string, unknown> = { status: data.status };
    if (data.trackingId) updates.trackingId = data.trackingId;
    if (data.courierName) updates.courierName = data.courierName;
    if (data.notes) updates.notes = data.notes;
    if (data.status === "delivered") updates.deliveredAt = new Date();
    if (data.status === "cancelled") updates.cancelledAt = new Date();

    const order = await Order.findByIdAndUpdate(data.orderId, updates, {
      new: true,
    }).lean();
    return JSON.parse(JSON.stringify(order));
  });

// ─── Get all orders (Admin) ───
export const getAllOrders = createServerFn({ method: "GET" })
  .validator((data: { status?: string; page?: number; pageSize?: number }) => data)
  .handler(async ({ data }) => {
    await connectDB();
    const { status, page = 1, pageSize = 20 } = data;
    const skip = (page - 1) * pageSize;
    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate("user", "name email")
        .lean(),
      Order.countDocuments(query),
    ]);

    return {
      items: JSON.parse(JSON.stringify(orders)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });
