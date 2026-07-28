export const LENDING_STAGES = [
  '1. New Loan',
  '2. Initial Email Sent / Documents Requested',
  '3. Initial Screening',
  '4. Under Review by Lender',
  '5. Term Sheet Received',
  '6. Good Faith Deposit Received',
  '7. UW Document \u2013 Requested',
  '8. UW Document \u2013 Received',
  '9. UW',
  '10. Closing Checklist \u2013 Received',
  '11. Closing Checklist \u2013 In Process',
  '12. Closing Checklist \u2013 Completed',
  '13. Loan Closed'
]

export const LENDING_STAGE_FIELDS: Record<string, Record<string, any>> = {
  '5. Term Sheet Received': {
    selected_lender: { label: 'Which Lender is Providing Loan?', type: 'text', required: true }
  },
  '6. Good Faith Deposit Received': {
    accutax_amount: { label: 'Accutax \u2013 Received (Amount)', type: 'number', required: false },
    accurate_lending_amount: { label: 'Accurate Lending \u2013 Received (Amount)', type: 'number', required: false },
    lender_bank_amount: { label: 'Lender Bank \u2013 Received (Amount)', type: 'number', required: false }
  },
  '7. UW Document \u2013 Requested': {
    requested_documents: { label: 'Which Documents were Requested? (Notes)', type: 'textarea', required: false }
  },
  '13. Loan Closed': {
    docs_saved: { label: 'Documents Saved?', type: 'dropdown', options: ['Yes', 'No'], required: false },
    check_from_bank: { label: 'Check Received from Bank', type: 'text', required: false },
    check_from_borrower: { label: 'Check Received from Borrower (if applicable)', type: 'text', required: false }
  }
}
