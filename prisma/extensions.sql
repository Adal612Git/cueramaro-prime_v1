-- Trigger para mantener columna updated_at consistente.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Vista para dashboard general.
CREATE OR REPLACE VIEW dashboard_overview_view AS
SELECT
  (SELECT COUNT(*) FROM "Sale")::INTEGER AS total_sales,
  (SELECT COALESCE(SUM("total"), 0) FROM "Sale") AS amount_sales,
  (SELECT COALESCE(SUM("amount"), 0) FROM "Expense") AS amount_expenses,
  (SELECT COUNT(*) FROM "Customer")::INTEGER AS total_customers,
  (SELECT COUNT(*) FROM "Product")::INTEGER AS total_products;

-- Asignación de trigger a tablas con columna updatedAt.
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_supplier_updated_at BEFORE UPDATE ON "Supplier"
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_customer_updated_at BEFORE UPDATE ON "Customer"
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_product_updated_at BEFORE UPDATE ON "Product"
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_lot_updated_at BEFORE UPDATE ON "Lot"
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_sale_updated_at BEFORE UPDATE ON "Sale"
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_expense_updated_at BEFORE UPDATE ON "Expense"
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
