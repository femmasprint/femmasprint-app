from pathlib import Path

p = Path('index.html')
s = p.read_text()

def rep(old, new, label, count=1):
    global s
    if old not in s:
        raise SystemExit(f'{label} anchor not found')
    s = s.replace(old, new, count)

rep("saleOpen: false, saleTitle: 'Sale', customerFormOpen: false", "saleOpen: false, saleEdit: null, saleTitle: 'Sale', customerFormOpen: false", 'state saleEdit')
rep("openSale = () => this.setState({ saleOpen: true, saleTitle: 'Sale', customer: '', saleMode: 'credit', saleRows:", "openSale = () => this.setState({ saleOpen: true, saleEdit: null, saleTitle: 'Sale', customer: '', saleMode: 'credit', receivedAmt: '', received: false, saleRows:", 'openSale reset')
rep("openForm = (title) => this.setState({ saleOpen: true, saleTitle: title, customer: '', saleMode: 'credit', saleRows:", "openForm = (title) => this.setState({ saleOpen: true, saleEdit: null, saleTitle: title, customer: '', saleMode: 'credit', receivedAmt: '', received: false, saleRows:", 'openForm reset')
rep("closeSale = () => this.setState({ saleOpen: false });", "closeSale = () => this.setState({ saleOpen: false, saleEdit: null });", 'closeSale reset')
rep("if (isDup) { try { if (!window.confirm(title + ' inayofanana tayari ipo (' + custName + ' · Sh ' + total.toLocaleString('en-US') + '). Uhakika unataka kuisave tena?')) return; } catch (e) {} }", "if (!this.state.saleEdit && isDup) { try { if (!window.confirm(title + ' inayofanana tayari ipo (' + custName + ' · Sh ' + total.toLocaleString('en-US') + '). Uhakika unataka kuisave tena?')) return; } catch (e) {} }", 'duplicate edit guard')

old_doc = """    const doc = { typeKey, no: String(seq).padStart(4, '0'), customer: custName, date, time: timeStr, ts: Date.now(), amount: total, balance: paid ? 0 : total, status: paid ? 'Paid' : (typeKey === 'estimate' ? 'Open' : 'Unpaid'), lines };
    this.setState(s => ({ saleOpen: false, savedDocs: [doc, ...(s.savedDocs || [])] }), () => this.showToast('✓ ' + title + ' FP/INV/' + doc.no + ' imehifadhiwa'));
"""
new_doc = """    const edit = this.state.saleEdit || null;
    const doc = { typeKey, no: String(seq).padStart(4, '0'), customer: custName, date, time: timeStr, ts: Date.now(), amount: total, balance: paid ? 0 : total, status: paid ? 'Paid' : (typeKey === 'estimate' ? 'Open' : 'Unpaid'), lines };
    if (typeKey === 'sale') {
      const iso = td.getFullYear() + '-' + String(td.getMonth() + 1).padStart(2, '0') + '-' + String(td.getDate()).padStart(2, '0');
      const receivedAmt = num(this.state.receivedAmt);
      const paidAmount = paid ? total : Math.max(0, Math.min(total, receivedAmt));
      const balance = Math.max(0, total - paidAmount);
      const status = balance <= 0 && total > 0 ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Unpaid');
      const invoiceNo = (edit && edit.invoiceNo) ? edit.invoiceNo : ('FP/INV/' + String(seq).padStart(4, '0'));
      const invoiceId = (edit && edit.invoiceId) ? edit.invoiceId : ('INV-' + iso.replace(/-/g, '') + '-' + Date.now());
      const customerMatch = (this.state.savedCustomers || []).find(c => String(c.name || c.CustomerName || '').trim().toLowerCase() === custName.toLowerCase());
      const baseRaw = edit && edit.raw && typeof edit.raw === 'object' ? edit.raw : {};
      const rec = Object.assign({}, baseRaw, { InvoiceID: invoiceId, InvoiceNo: invoiceNo, Date: (edit && edit.date) ? edit.date : iso, CustomerID: baseRaw.CustomerID || (customerMatch ? (customerMatch.CustomerID || '') : ''), CustomerName: custName, Phone: (edit && edit.phone) ? edit.phone : (baseRaw.Phone || (customerMatch ? (customerMatch.phone || customerMatch.Phone || '') : '')), TotalAmount: total, PaidAmount: paidAmount, Balance: balance, Status: status, UpdatedAt: new Date().toISOString(), DocumentName: baseRaw.DocumentName || 'Sales Invoice', DocumentType: 'Invoice', DocumentNumber: invoiceNo, Time: timeStr, DueDate: (edit && edit.dueDate) ? edit.dueDate : (baseRaw.DueDate || ''), TaxInvoice: baseRaw.TaxInvoice === false ? false : true, LinesJson: JSON.stringify(lines), PayMode: this.state.saleMode === 'cash' ? 'Cash' : 'Credit' });
      this.setState(st => { const current = st.savedInvoices || []; const replaced = current.some(x => (x.InvoiceID && x.InvoiceID === invoiceId) || String(x.InvoiceNo || '') === String(invoiceNo || '')); const savedInvoices = replaced ? current.map(x => ((x.InvoiceID && x.InvoiceID === invoiceId) || String(x.InvoiceNo || '') === String(invoiceNo || '')) ? rec : x) : [rec, ...current]; const savedDocs = edit && edit.source === 'local' ? (st.savedDocs || []).filter(d => !(d.typeKey === 'sale' && String(d.no) === String(edit.sourceKey))) : (st.savedDocs || []); return { saleOpen: false, saleEdit: null, savedInvoices, savedDocs, siSelectedNo: invoiceNo }; }, () => { try { localStorage.setItem('fp_invoices_cache', JSON.stringify(this.state.savedInvoices || [])); } catch (e) {} try { this.saveLocalCache_ && this.saveLocalCache_(); } catch (e) {} this.showToast('⏳ ' + invoiceNo + (edit ? ' inahifadhi mabadiliko…' : ' inahifadhiwa…')); });
      if (/\\/exec$/.test((this.state.backendUrl || '').trim())) this.backendPost_({ action: 'saveRow', tab: 'Invoices', record: rec }).then(() => { this.showToast('✓ ' + invoiceNo + (edit ? ' imehaririwa na kuhifadhiwa' : ' imehifadhiwa')); this.loadInvoices(); }).catch(e => { console.error('Invoice save failed', e); this.showToast('Invoice imehifadhiwa kwenye kifaa; Google Sync haijakamilika'); }); else this.showToast('✓ ' + invoiceNo + ' imehifadhiwa kwenye kifaa');
      return;
    }
    this.setState(s => ({ saleOpen: false, savedDocs: [doc, ...(s.savedDocs || [])] }), () => { try { this.saveLocalCache_ && this.saveLocalCache_(); } catch(e){} this.showToast('✓ ' + title + ' FP/INV/' + doc.no + ' imehifadhiwa'); });
"""
rep(old_doc, new_doc, 'durable sale save')
rep("const docNoVal = (docPrefixMap[docKind] || 'FP/INV/') + String(nextInvSeq).padStart(4, '0');", "const docNoVal = (this.state.saleEdit && this.state.saleEdit.invoiceNo) ? this.state.saleEdit.invoiceNo : ((docPrefixMap[docKind] || 'FP/INV/') + String(nextInvSeq).padStart(4, '0'));", 'edit invoice number')
rep("formIsInvoice: this.state.saleTitle === 'Sale', formHeading: this.state.saleTitle === 'Sale' ? 'Invoice Mpya' : this.state.saleTitle,", "formIsInvoice: this.state.saleTitle === 'Sale', formHeading: this.state.saleTitle === 'Sale' ? (this.state.saleEdit ? 'Hariri Invoice' : 'Invoice Mpya') : this.state.saleTitle, saveInvoiceButtonLabel: this.state.saleEdit ? 'Hifadhi Mabadiliko' : 'Hifadhi Invoice',", 'edit heading')

old_record = "const recordSelectedPayment = () => { if (!selected) return; this.setState({ payInOpen: true, payInErr: '', payInForm: { customer: selected.customer, amount: '', payMode: '', relType: 'Invoice', relId: selected.no, ref: selected.no, notes: 'Payment for ' + selected.no } }); };"
new_record = """const recordSelectedPayment = () => { if (!selected) return; this.setState({ payInOpen: true, payInErr: '', payInForm: { customer: selected.customer, amount: '', payMode: '', relType: 'Invoice', relId: selected.no, ref: selected.no, notes: 'Payment for ' + selected.no } }); };
        const editSelectedInvoice = () => { if (!selected) return; const raw = selected.sourceRecord || {}; let srcLines = []; if (selected.source === 'local') srcLines = Array.isArray(raw.lines) ? raw.lines : []; else { try { srcLines = Array.isArray(raw.LinesJson) ? raw.LinesJson : JSON.parse(raw.LinesJson || raw.lines || '[]'); } catch (e) { srcLines = []; } } let editRows = (srcLines || []).map(l => ({ item: l.item || l.Item || l.name || '', desc: l.desc || l.Description || l.description || '', count: '', qty: String(l.qty != null ? l.qty : (l.Qty != null ? l.Qty : '')), unit: l.unit || l.Unit || 'NONE', price: String(l.price != null ? l.price : (l.UnitPrice != null ? l.UnitPrice : '')).replace(/,/g, '') })); if (!editRows.length) editRows = [{ item: '', desc: '', count: '', qty: '1', unit: 'NONE', price: String(selected.amountNum || '') }]; editRows.push({ item: '', desc: '', count: '', qty: '', unit: 'NONE', price: '' }); this.setState({ saleOpen: true, saleTitle: 'Sale', customer: selected.customer === '—' ? '' : selected.customer, saleMode: selected.balanceNum > 0 ? 'credit' : 'cash', receivedAmt: selected.paidNum > 0 ? String(selected.paidNum) : '', received: selected.paidNum > 0, saleRows: editRows, saleEdit: { source: selected.source, sourceKey: selected.sourceKey, invoiceId: raw.InvoiceID || '', invoiceNo: selected.no, date: raw.Date || '', phone: selected.phone || raw.Phone || '', dueDate: raw.DueDate || '', raw } }); };"""
rep(old_record, new_record, 'selected invoice editor')
rep("invSelRecordPayment: recordSelectedPayment, invSelDelete: deleteSelectedInvoice,", "invSelRecordPayment: recordSelectedPayment, invSelEdit: editSelectedInvoice, invSelDelete: deleteSelectedInvoice,", 'expose edit action')
rep('<button class="fpInvActionSoft" onClick="{{ openInvoiceForm }}">Hariri</button>', '<button class="fpInvActionSoft" onClick="{{ invSelEdit }}">Hariri</button>', 'edit button binding')
rep('><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M5 12l5 5L20 6"></path></svg>Hifadhi Invoice</button>', '><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M5 12l5 5L20 6"></path></svg>{{ saveInvoiceButtonLabel }}</button>', 'save label button')

p.write_text(s)
print('Invoice flow patched successfully')
