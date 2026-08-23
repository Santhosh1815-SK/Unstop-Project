from core.mock_db import CUSTOMERS, ORDERS

def get_order(order_id: str):
    return ORDERS.get(order_id, {"error": "Order not found"})

def get_customer(customer_id: str):
    return CUSTOMERS.get(customer_id, {"error": "Customer not found"})

def cancel_order(order_id: str):
    if order_id in ORDERS:
        ORDERS[order_id]["status"] = "CANCELLED"
        return {"status": "success", "message": f"Order {order_id} cancelled"}
    return {"error": "Order not found"}

def issue_refund(order_id: str, amount: float):
    if order_id in ORDERS:
        return {"status": "success", "message": f"Refunded ${amount} for order {order_id}"}
    return {"error": "Order not found"}

def send_email(to: str, subject: str, body: str):
    return {"status": "success", "message": f"Email sent to {to}"}

TOOL_REGISTRY = {
    "get_order": get_order,
    "get_customer": get_customer,
    "cancel_order": cancel_order,
    "issue_refund": issue_refund,
    "send_email": send_email
}
