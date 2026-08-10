import { useState } from 'react';

const FAQS = [
  {
    q: 'How does Murabaha work?',
    a: 'Murabaha is a cost-plus financing structure. We purchase the product, add a fixed profit margin, and sell it to you on deferred payment. You pay in equal installments with no interest.',
  },
  {
    q: 'Who owns the product during financing?',
    a: 'Ownership transfers to you immediately upon signing the agreement. We do not retain ownership as security.',
  },
  {
    q: 'What documents are required?',
    a: 'CNIC copy, recent bank statements, salary slips or business proof, and utility bills for load assessment.',
  },
  {
    q: 'How long does approval take?',
    a: 'Typically 24–48 hours after all documents are submitted.',
  },
  {
    q: 'Do you install the products?',
    a: 'Yes, we provide installation services through our certified partners.',
  },
  {
    q: 'Can businesses apply?',
    a: 'Absolutely. We have commercial solutions for businesses, factories, schools, and more.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="container page-section">
      <h2>
        <i className="fas fa-question-circle" style={{ color: 'var(--accent)' }} /> Frequently Asked
        Questions
      </h2>
      <div className="card mt-16">
        {FAQS.map((f, i) => (
          <div className="faq-item" key={f.q}>
            <div
              className="question"
              onClick={() => setOpen(open === i ? null : i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setOpen(open === i ? null : i)}
            >
              {f.q}{' '}
              <i className={`fas fa-chevron-${open === i ? 'up' : 'down'}`} />
            </div>
            <div className={`answer${open === i ? ' open' : ''}`}>{f.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
