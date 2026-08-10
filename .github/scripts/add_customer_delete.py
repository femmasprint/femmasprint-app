from pathlib import Path

p = Path('index.html')
s = p.read_text()

def rep(old, new, label, count=1):
    global s
    if old not in s:
        raise SystemExit(label + ' anchor not found')
    s = s.replace(old, new, count)

rep(
    "marketingConsent: c.MarketingConsent || 'No', synced: true, status: 'active'",
    "marketingConsent: c.MarketingConsent || 'No', synced: true, status: String(c.Status || c.status || 'Active').toLowerCase()",
    'pull customer status'
)

rep(
    "const savedCustRows = (customerScreens.includes(screen) ? (this.state.savedCustomers || []) : []).map(c => [c.name, c.openingBalance || 0, c.phone || '—', c.email || '—', c.address || 'Tanzania', [], c.synced]);",
    "const savedCustRows = (customerScreens.includes(screen) ? (this.state.savedCustomers || []).filter(c => String(c.status || 'active').toLowerCase() !== 'deleted') : []).map(c => [c.name, c.openingBalance || 0, c.phone || '—', c.email || '—', c.address || 'Tanzania', [], c.synced]);",
    'customer active list filter'
)

rep(
    "closeCustomerForm = () => this.setState({ customerFormOpen: false });",
    """closeCustomerForm = () => this.setState({ customerFormOpen: false });
  deleteSelectedCustomer = () => {
    const name = String(this.state.selectedCustomerName || '').trim();
    if (!name) { this.showToast('Chagua customer kwanza'); return; }
    const found = (this.state.savedCustomers || []).find(c => String(c.name || '').trim().toLowerCase() === name.toLowerCase() && String(c.status || 'active').toLowerCase() !== 'deleted');
    if (!found) { this.showToast('Customer huyu hajapatikana kwenye database ya app'); return; }
    let ok = false;
    try { ok = window.confirm('Hamisha ' + name + ' kwenda Pipa la Taka?\\n\\nHistoria ya invoice na malipo haitafutwa.'); } catch (e) { ok = false; }
    if (!ok) return;
    const now = new Date().toISOString();
    const deleted = { ...found, status: 'deleted', deletedAt: now, synced: false };
    this.setState(st => {
      const list = (st.savedCustomers || []).map(c => c.id === found.id ? deleted : c);
      try { this.persistCustomers_(list); } catch (e) {}
      return { savedCustomers: list, selectedCustomerName: '', customerSearch: '' };
    }, () => this.showToast('✓ ' + name + ' amehamishwa kwenye Pipa la Taka'));
    if (!/\\/exec$/.test((this.state.backendUrl || '').trim())) return;
    const rec = {
      CustomerID: found.id || '',
      Name: found.name || name,
      CustomerName: found.name || name,
      Phone: found.phone || '',
      Email: found.email || '',
      Address: found.address || 'Tanzania',
      MarketingConsent: found.marketingConsent || 'No',
      OpeningBalance: found.openingBalance || 0,
      GSTIN_VRN: found.vrn || '',
      Status: 'Deleted',
      UpdatedAt: now,
      DeletedAt: now
    };
    this.backendPost_({ action: 'saveRow', tab: 'Customers', record: rec })
      .then(() => this.setState(st => {
        const list = (st.savedCustomers || []).map(c => c.id === found.id ? { ...c, status: 'deleted', synced: true } : c);
        try { this.persistCustomers_(list); } catch (e) {}
        return { savedCustomers: list };
      }))
      .catch(e => { console.error('Customer delete sync failed', e); this.showToast('Customer ameondolewa kwenye app; Sync ya Pipa la Taka haijakamilika'); });
  };""",
    'delete customer method'
)

rep(
    "customerFormOpen: this.state.customerFormOpen, openCustomerForm: this.openCustomerForm, closeCustomerForm: this.closeCustomerForm,",
    "customerFormOpen: this.state.customerFormOpen, openCustomerForm: this.openCustomerForm, closeCustomerForm: this.closeCustomerForm, deleteSelectedCustomer: this.deleteSelectedCustomer,",
    'expose delete customer'
)

old_btn = '<button onClick="{{ openCustomerForm }}" title="Edit customer" style="width:30px;height:30px;border:none;background:none;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#3496f3" style-hover="background:#eef5fd;border-radius:8px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3496f3" stroke-width="2"><path d="M12 20h9M16.5 3.5a2 2 0 113 3L7 19l-4 1 1-4z"></path></svg></button>'
new_btn = old_btn + '<button onClick="{{ deleteSelectedCustomer }}" title="Futa customer" style="width:30px;height:30px;border:none;background:none;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#e11d48" style-hover="background:#fff1f2;border-radius:8px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"></path></svg></button>'
rep(old_btn, new_btn, 'customer delete button')

p.write_text(s)
print('customer delete flow patched')
