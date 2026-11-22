import pandas as pd
excel_path = '04_Manufacturing.xlsx'

fg = pd.read_excel(excel_path, sheet_name='Finished_Goods')
rm = pd.read_excel(excel_path, sheet_name='Raw_Materials')
pb = pd.read_excel(excel_path, sheet_name='Production_Batches')
md = pd.read_excel(excel_path, sheet_name='Machine_Downtime')
qi = pd.read_excel(excel_path, sheet_name='Quality_Inspections')
mu = pd.read_excel(excel_path, sheet_name='Material_Usage')
ex = pd.read_excel(excel_path, sheet_name='Expenses')

print('=== INTEGRITY CHECKS ===')
print('Unique FG product_ids:', fg['product_id'].nunique(), 'Total:', len(fg))
print('Unique RM material_ids:', rm['material_id'].nunique(), 'Total:', len(rm))
print('Unique PB batch_ids:', pb['batch_id'].nunique(), 'Total:', len(pb))
print('Unique MD downtime_ids:', md['downtime_id'].nunique(), 'Total:', len(md))
print('Unique QI inspection_ids:', qi['inspection_id'].nunique(), 'Total:', len(qi))
print('Unique MU usage_ids:', mu['usage_id'].nunique(), 'Total:', len(mu))
print('Unique EX expense_ids:', ex['expense_id'].nunique(), 'Total:', len(ex))

# Check foreign keys
pb_fg_diff = set(pb['product_id']) - set(fg['product_id'])
print('PB product_ids not in FG:', len(pb_fg_diff))

qi_pb_diff = set(qi['batch_id']) - set(pb['batch_id'])
print('QI batch_ids not in PB:', len(qi_pb_diff))

mu_pb_diff = set(mu['batch_id']) - set(pb['batch_id'])
print('MU batch_ids not in PB:', len(mu_pb_diff))

mu_rm_diff = set(mu['material_id']) - set(rm['material_id'])
print('MU material_ids not in RM:', len(mu_rm_diff))

print('\n=== DATE RANGES ===')
for name, df, col in [
    ('Production_Batches', pb, 'production_date'),
    ('Machine_Downtime', md, 'event_date'),
    ('Quality_Inspections', qi, 'inspection_date'),
    ('Material_Usage', mu, 'usage_date'),
    ('Expenses', ex, 'expense_date')
]:
    d = pd.to_datetime(df[col])
    print(f"{name} {col}: {d.min().strftime('%Y-%m-%d')} to {d.max().strftime('%Y-%m-%d')}")

print('\n=== PRODUCTION STATS ===')
print(f"Planned Qty: {pb['planned_quantity'].sum():,}")
print(f"Produced Qty: {pb['produced_quantity'].sum():,}")
print(f"Rejected Qty: {pb['rejected_quantity'].sum():,}")
achv = (pb['produced_quantity'].sum() / pb['planned_quantity'].sum()) * 100
yield_pct = ((pb['produced_quantity'].sum() - pb['rejected_quantity'].sum()) / pb['produced_quantity'].sum()) * 100
print(f"Achievement %: {achv:.2f}%")
print(f"Yield %: {yield_pct:.2f}%")

print('\n=== QUALITY STATS ===')
print(f"Inspected Units: {qi['inspected_units'].sum():,}")
print(f"Defective Units: {qi['defective_units'].sum():,}")
defect_rate = (qi['defective_units'].sum() / qi['inspected_units'].sum()) * 100
print(f"Defect Rate %: {defect_rate:.2f}%")
print('Results breakdown:\n', qi['inspection_result'].value_counts())
print('Defect Types:\n', qi['defect_type'].value_counts(dropna=False))

print('\n=== MACHINE DOWNTIME STATS ===')
print(f"Total Downtime Minutes: {md['downtime_minutes'].sum():,}")
print(f"Total Downtime Hours: {md['downtime_minutes'].sum() / 60:.2f}")
print(f"Total Maintenance Cost: INR {md['maintenance_cost'].sum():,.2f}")
print('Severity breakdown:\n', md['severity'].value_counts())
print('Reason breakdown:\n', md['reason'].value_counts())

print('\n=== MATERIAL USAGE STATS ===')
print(f"Total Quantity Used: {mu['quantity_used'].sum():,.2f}")
print(f"Total Wastage Quantity: {mu['wastage_quantity'].sum():,.2f}")
wastage_pct = (mu['wastage_quantity'].sum() / (mu['quantity_used'].sum() + mu['wastage_quantity'].sum())) * 100
print(f"Wastage %: {wastage_pct:.2f}%")

print('\n=== EXPENSES STATS ===')
print(f"Total Manufacturing Expenses: INR {ex['amount'].sum():,.2f}")
print('Cost center breakdown:\n', ex.groupby('cost_center')['amount'].sum())
print('Category breakdown:\n', ex.groupby('category')['amount'].sum())

print('\n=== RAW MATERIALS STATS ===')
print(f"Total Stock Quantity: {rm['stock_quantity'].sum():,}")
inventory_val = (rm['stock_quantity'] * rm['unit_cost']).sum()
print(f"Total Inventory Value: INR {inventory_val:,.2f}")
low_stock = rm[rm['stock_quantity'] <= rm['reorder_level']]
print(f"Materials below or at reorder level: {len(low_stock)}")
