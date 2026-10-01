import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "./auth";
import { db } from "./db";
import { expireStaleOrders, orderInclude, type OrderWithDetails } from "./orders";

/**
 * Замовлення поточного користувача. Чуже або неіснуюче замовлення дає 404,
 * щоб за адресою не можна було дізнатися про чужі бронювання.
 */
export async function getOwnOrder(orderId: string, returnPath: string): Promise<OrderWithDetails> {
  const user = await requireUser(returnPath);
  await expireStaleOrders();
  const order = await db.order.findFirst({ where: { id: orderId, userId: user.id }, include: orderInclude });
  if (!order) notFound();
  return order;
}
