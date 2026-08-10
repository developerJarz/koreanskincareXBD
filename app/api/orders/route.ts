import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/server/db/connection";
import { Order, Product } from "@/server/db/models";

// POST — Create a new order
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    await connectDB();

    const orderItems = [];
    let subtotal = 0;

    for (const item of data.items) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(item.productId);
      const product = isObjectId
        ? await Product.findById(item.productId).lean()
        : await Product.findOne({ slug: item.productId }).lean();

      if (!product) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 404 });
      }

      let price = product.price;
      let variantInfo = undefined;

      if (item.variantSku && product.variants?.length) {
        const variant = product.variants.find((v: any) => v.sku === item.variantSku);
        if (variant) {
          price = variant.price;
          variantInfo = { sku: variant.sku, color: variant.color, size: variant.size };
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

      if (product.trackInventory) {
        await Product.updateOne(
          { _id: product._id },
          { $inc: { stock: -item.quantity, totalSold: item.quantity } },
        );
      }
    }

    const isDhaka =
      data.shippingAddress?.division === "Dhaka" && data.shippingAddress?.district === "Dhaka";
    const shippingCost = subtotal >= 2000 ? 0 : isDhaka ? 70 : 120;
    const total = subtotal + shippingCost;

    // Only set user if it's a valid MongoDB ObjectId
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

    return NextResponse.json(JSON.parse(JSON.stringify(order.toJSON())), { status: 201 });
  } catch (err: any) {
    console.error("Create order error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create order" },
      { status: 500 },
    );
  }
}

// GET — List all orders (admin) with optional status filter
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(50, Number(searchParams.get("pageSize") ?? "20"));
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

    return NextResponse.json({
      items: JSON.parse(JSON.stringify(orders)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err: any) {
    console.error("List orders error:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
