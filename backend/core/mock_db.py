CUSTOMERS = {
    "CUST-001": {"id": "CUST-001", "name": "Alice Smith", "email": "alice@example.com"},
    "CUST-002": {"id": "CUST-002", "name": "Bob Johnson", "email": "bob@example.com"}
}

ORDERS = {
    "ORD-100": {"id": "ORD-100", "customer_id": "CUST-001", "total": 450.0, "status": "SHIPPED", "items": ["Laptop"]},
    "ORD-200": {"id": "ORD-200", "customer_id": "CUST-002", "total": 50.0, "status": "PENDING", "items": ["Mouse"]},
    "ORD-999": {"id": "ORD-999", "customer_id": "CUST-001", "total": 500.0, "status": "PROCESSING", "items": ["Monitor"]}
}
