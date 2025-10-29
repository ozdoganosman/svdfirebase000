# Testing Checklist - Sprint 1 Features

## Deployment Information

**Production URLs:**
- **Frontend**: https://svdfirebase000.web.app
- **API**: https://api-tfi7rlxtca-uc.a.run.app

**Deployed Features:**
- ✅ B2B Teklif & Numune Sistemi (Faz 2.1)
- ✅ VIP Müşteri Yönetimi (Faz 2.2)
- ✅ PDF Generation
- ✅ Email System (requires extension setup)

---

## Test Scenarios

### 1. B2B Quote System Testing

#### 1.1 Customer Quote Request
- [ ] Navigate to product pages
- [ ] Add products to cart
- [ ] Click "Teklif İste" (Request Quote) button
- [ ] Verify quote form opens
- [ ] Check that customer info auto-fills for logged-in users
- [ ] Fill in all required fields
- [ ] Submit quote request
- [ ] Verify success message
- [ ] Check that quote appears in "Hesabım > Teklifler"

#### 1.2 Admin Quote Management
- [ ] Login as admin
- [ ] Navigate to **Admin > Teklifler** (`/admin/quotes`)
- [ ] Verify quote list displays correctly
- [ ] Filter quotes by status (Pending, Approved, Rejected)
- [ ] Click on a quote to view details
- [ ] Verify all customer and product information displays
- [ ] Test quote approval:
  - [ ] Click "Onayla" (Approve)
  - [ ] Add admin notes
  - [ ] Submit approval
  - [ ] Verify status changes to "Onaylandı"
- [ ] Test quote rejection:
  - [ ] Click "Reddet" (Reject)
  - [ ] Add rejection reason
  - [ ] Submit rejection
  - [ ] Verify status changes to "Reddedildi"

#### 1.3 Quote PDF Generation
- [ ] In admin quotes page, click "PDF İndir" on an approved quote
- [ ] Verify PDF downloads
- [ ] Open PDF and check:
  - [ ] SVD Ambalaj branding/header
  - [ ] Quote number (TEK-YYYYMMDD-XXXX)
  - [ ] Customer information
  - [ ] Product table with quantities and prices
  - [ ] Subtotal, tax, and total amounts
  - [ ] Admin notes (if any)
  - [ ] Professional formatting

#### 1.4 Quote to Order Conversion
- [ ] Login as customer with approved quote
- [ ] Navigate to "Hesabım > Teklifler"
- [ ] Find an approved quote
- [ ] Click "Sipariş Ver" (Place Order) button
- [ ] Verify redirect to checkout page
- [ ] Check that checkout form is pre-filled with:
  - [ ] Customer name
  - [ ] Company name
  - [ ] Email
  - [ ] Phone
  - [ ] Tax number
  - [ ] Address
  - [ ] City
- [ ] Complete checkout process
- [ ] Verify order is created successfully
- [ ] Return to "Teklifler" page
- [ ] Verify quote status changed to "Converted"

---

### 2. B2B Sample Request System Testing

#### 2.1 Customer Sample Request
- [ ] Add products to cart
- [ ] Click "Numune Talep Et" (Request Sample) button
- [ ] Verify sample request form opens
- [ ] Check auto-fill for logged-in users
- [ ] Fill in sample requirements/notes
- [ ] Submit sample request
- [ ] Verify success message
- [ ] Check that request appears in "Hesabım > Numuneler"

#### 2.2 Admin Sample Management
- [ ] Login as admin
- [ ] Navigate to **Admin > Numuneler** (`/admin/samples`)
- [ ] Verify sample request list displays
- [ ] Filter by status (Requested, Approved, Preparing, Shipped, Delivered)
- [ ] View sample request details
- [ ] Test status workflow:
  - [ ] Change status to "Onaylandı" (Approved)
  - [ ] Change status to "Hazırlanıyor" (Preparing)
  - [ ] Change status to "Kargoya Verildi" (Shipped)
  - [ ] Add tracking number
  - [ ] Change status to "Teslim Edildi" (Delivered)
- [ ] Verify status updates appear in customer view

---

### 3. VIP Customer System Testing

#### 3.1 VIP Tier Calculation
- [ ] Login as admin
- [ ] Navigate to **Admin > Müşteriler** (`/admin/customers`)
- [ ] Verify customer list displays with VIP badges
- [ ] Click "Tümünü Hesapla" (Calculate All) button
- [ ] Wait for batch calculation to complete
- [ ] Verify VIP tiers are assigned based on:
  - **Platinum**: Customers with 50K+ orders, 10+ count, 30%+ conversion
  - **Gold**: Customers with 30K+ orders, 7+ count, 25%+ conversion
  - **Silver**: Customers with 15K+ orders, 5+ count, 20%+ conversion
  - **Bronze**: Customers with 5K+ orders, 3+ count, 15%+ conversion

#### 3.2 Manual VIP Tier Assignment
- [ ] Select a customer from the list
- [ ] Click "VIP Seviyesi Ata" (Assign VIP Tier)
- [ ] Choose a tier (Platinum, Gold, Silver, Bronze)
- [ ] Click "Kaydet" (Save)
- [ ] Verify tier is updated
- [ ] Verify "Manuel" (Manual) badge appears
- [ ] Check that discount percentage displays correctly:
  - Platinum: 20%
  - Gold: 15%
  - Silver: 10%
  - Bronze: 5%

#### 3.3 Customer Segmentation
- [ ] In admin customers page, use segment filter
- [ ] Test filtering by:
  - [ ] VIP (customers with VIP tiers)
  - [ ] High-Potential (2+ orders, 10K+ value, active last 3 months)
  - [ ] New (1 order or quote, recent customer)
  - [ ] Passive (old customer, 6+ months inactive)
  - [ ] Standard (other customers)
- [ ] Verify correct customers display for each segment

#### 3.4 VIP Customer Experience
- [ ] Create test customer account or use existing
- [ ] Assign VIP tier to this customer (use admin panel)
- [ ] Logout and login as VIP customer
- [ ] Navigate to "Hesabım" (Account)
- [ ] Verify VIP badge displays at top:
  - [ ] Correct tier name (Platinum/Gold/Silver/Bronze)
  - [ ] Correct icon (💎/🥇/🥈/🥉)
  - [ ] Discount percentage shown
- [ ] Check VIP progress section displays:
  - [ ] Current tier information
  - [ ] Progress bar to next tier
  - [ ] Statistics (total spent, order count)

#### 3.5 VIP Pricing
- [ ] Login as VIP customer
- [ ] Browse products
- [ ] Verify prices show VIP discount:
  - [ ] Original price displayed
  - [ ] Discounted VIP price displayed
  - [ ] Discount amount shown
- [ ] Add products to cart
- [ ] Verify cart totals reflect VIP discount
- [ ] Proceed to checkout
- [ ] Verify checkout totals include VIP discount

---

### 4. Email System Testing

**Note:** Requires Firebase Trigger Email Extension to be installed and configured. See [EMAIL_EXTENSION_SETUP.md](EMAIL_EXTENSION_SETUP.md).

#### 4.1 Quote Approved Email
- [ ] Install and configure Firebase Trigger Email Extension
- [ ] Admin approves a quote
- [ ] Check customer email inbox
- [ ] Verify email received with:
  - [ ] Subject: "Teklifiniz Onaylandı"
  - [ ] Quote details (products, totals)
  - [ ] Admin notes
  - [ ] PDF attachment
  - [ ] Professional HTML formatting

#### 4.2 Quote Rejected Email
- [ ] Admin rejects a quote with notes
- [ ] Check customer email
- [ ] Verify rejection email received with:
  - [ ] Subject: "Teklifiniz Hakkında"
  - [ ] Rejection reason/notes
  - [ ] Contact information

#### 4.3 Sample Approved Email
- [ ] Admin approves a sample request
- [ ] Check customer email
- [ ] Verify approval email with:
  - [ ] Sample product list
  - [ ] Approval confirmation
  - [ ] Next steps information

#### 4.4 Admin Notification Emails
- [ ] Customer submits new quote
- [ ] Check admin email (configured in extension)
- [ ] Verify new quote notification received
- [ ] Customer submits sample request
- [ ] Verify new sample notification received

#### 4.5 Email Monitoring
- [ ] Go to **Firebase Console** > **Firestore**
- [ ] Navigate to `mail` collection
- [ ] Check email documents
- [ ] Verify `delivery.state` field:
  - SUCCESS = Email sent
  - ERROR = Failed (check error message)
  - PENDING = Queued
- [ ] Check `delivery.info.messageId` for tracking

---

### 5. Integration Testing

#### 5.1 Complete B2B Flow
- [ ] Customer requests quote
- [ ] Admin receives notification (if emails configured)
- [ ] Admin reviews and approves quote
- [ ] Customer receives approval email with PDF
- [ ] Customer converts quote to order
- [ ] Order is created successfully
- [ ] Quote status updated to "Converted"
- [ ] Customer receives order confirmation

#### 5.2 VIP Customer Journey
- [ ] New customer creates account
- [ ] Customer places first order
- [ ] Customer shows as "New" segment
- [ ] Customer places multiple orders (total $10K+)
- [ ] Admin runs VIP calculation
- [ ] Customer assigned Bronze tier
- [ ] Customer sees VIP badge on account page
- [ ] Customer shops with 5% discount
- [ ] Customer continues ordering
- [ ] Eventually upgraded to Silver/Gold/Platinum

#### 5.3 Quote + VIP Combined
- [ ] VIP customer requests quote
- [ ] Quote shows VIP pricing
- [ ] Admin approves quote
- [ ] Customer converts to order with VIP discount
- [ ] Order total reflects VIP pricing

---

## Performance Testing

### Load Testing
- [ ] Test with 10+ concurrent users
- [ ] Test quote PDF generation speed
- [ ] Test VIP calculation with 100+ customers
- [ ] Verify page load times < 3 seconds

### Database Queries
- [ ] Check Firestore usage in Firebase Console
- [ ] Verify queries are optimized
- [ ] Ensure indexes are created for:
  - Quotes by status
  - Samples by status
  - Orders by userId
  - VIP calculations

---

## Security Testing

### Authentication
- [ ] Verify admin routes require authentication
- [ ] Test that customers cannot access admin pages
- [ ] Verify API endpoints check authentication tokens
- [ ] Test that users can only view their own quotes/orders

### Data Validation
- [ ] Test quote form with invalid data
- [ ] Test VIP tier assignment with invalid tier names
- [ ] Verify API returns proper error codes
- [ ] Test CSRF protection

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (iOS)
- [ ] Mobile Safari (iOS)

---

## Mobile Responsiveness

Test on mobile devices:
- [ ] Quote request form layout
- [ ] Admin quote management interface
- [ ] VIP badge display on account page
- [ ] Customer list in admin panel
- [ ] PDF generation and viewing
- [ ] Cart and checkout with VIP pricing

---

## Error Scenarios

### Network Errors
- [ ] Test quote submission with poor connection
- [ ] Test PDF download with slow connection
- [ ] Verify proper error messages display

### Edge Cases
- [ ] Quote with 0 items
- [ ] VIP calculation with no orders
- [ ] PDF generation with very long product names
- [ ] Email sending failure handling
- [ ] Quote conversion for already-converted quote

---

## Known Limitations

1. **Email System**: Requires Firebase Trigger Email Extension installation via Firebase Console
2. **Node Version Warning**: Frontend configured for Node 20, running on Node 22 (non-critical)
3. **PDF Attachments**: Limited to ~10MB per email
4. **VIP Auto-calculation**: Runs on-demand, not scheduled (can be automated with Cloud Scheduler)

---

## Post-Testing Actions

After completing tests:
- [ ] Document any bugs found
- [ ] Update README with production URLs
- [ ] Configure email extension if not done
- [ ] Set up monitoring alerts (Firebase)
- [ ] Enable Google Analytics (if needed)
- [ ] Configure backup schedule
- [ ] Set up error reporting (Sentry/Crashlytics)

---

## Success Criteria

Sprint 1 is considered successful if:
- ✅ All B2B quote workflows complete without errors
- ✅ VIP system correctly calculates and applies discounts
- ✅ PDFs generate with correct information
- ✅ Email system queues emails properly (delivery depends on extension setup)
- ✅ Quote-to-order conversion works seamlessly
- ✅ No critical security vulnerabilities
- ✅ Performance meets acceptable standards (< 3s page loads)
- ✅ Mobile experience is functional and user-friendly

---

## Next Steps

Once testing is complete and successful:
1. Configure Firebase Trigger Email Extension for production
2. Monitor Firebase Console for errors/logs
3. Gather user feedback
4. Plan Sprint 2 features
5. Consider implementing:
   - Automated VIP recalculation (Cloud Scheduler)
   - Advanced analytics dashboard
   - Quote expiration handling (30-day validity)
   - Email templates customization
