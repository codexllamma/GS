import LegalLayout from "@/components/legalLayout";

export default function DeliveryReturnsCODPolicy() {
  return (
    <LegalLayout title="Delivery, Returns & COD Policy">
      <section className="space-y-6 text-sm leading-relaxed text-neutral-700">
        
        <h2 className="font-medium text-neutral-900 text-base">Delivery Timelines</h2>
        <p>
          Orders are typically delivered within 3 to 5 business days from the date of
          dispatch. Delivery timelines may vary due to operational constraints,
          service availability at destination pincode, public holidays, or unforeseen
          logistics delays. Customers will be notified in case of significant delays.
          Delivery services are currently available within India only.
        </p>

        <h2 className="font-medium text-neutral-900 text-base">Order Processing</h2>
        <p>
          Orders are processed after verification of product availability and
          customer contact details. In case an order cannot be fulfilled, the customer
          will be informed and the order may be cancelled with a full refund if prepaid.
        </p>

        <h2 className="font-medium text-neutral-900 text-base">Cash on Delivery</h2>
        <p>
          Cash on Delivery is available for eligible orders at select pincodes only.
          A cash handling fee will be charged for COD orders. The cash handling fee is
          INR 32 or 1.8 percent of the order value, whichever is higher. COD must be
          paid in full to the delivery partner at the time of delivery. Partial payments
          will not be accepted. Refusal to accept a COD order may result in suspension
          of COD service for future orders.
        </p>

        <h2 className="font-medium text-neutral-900 text-base">Return and Exchange Policy</h2>
        <p>
          Products are eligible for return or exchange within 3 to 5 business days from
          the date of delivery, subject to the conditions mentioned below. Customers
          must raise a return or exchange request within the eligibility window.
          Product pickups for returns or exchanges are subject to serviceability by the
          logistics partner at the customer’s location.
        </p>

        <h2 className="font-medium text-neutral-900 text-base">Conditions for Return and Exchange</h2>
        <p>
          Items must be unused, unwashed, unaltered, and in original packaging with
          tags intact. Products showing signs of wear, damage, stains, or modification
          will not be accepted. Successful pickup does not guarantee acceptance. All
          items undergo quality check upon arrival at our facility. If the item fails
          inspection, the request may be rejected and the item will be returned to the
          customer.
        </p>

        <h2 className="font-medium text-neutral-900 text-base">Refunds</h2>
        <p>
          Refunds for prepaid orders will be processed after the returned product passes
          quality checks. Refunds will be issued to the original mode of payment. Timelines
          depend on payment gateway and bank policies. Delivery charges and COD fees are
          non-refundable. If any promotional offer was applied, refunds will be adjusted
          according to the offer terms.
        </p>

        <h2 className="font-medium text-neutral-900 text-base">COD Returns and Exchanges</h2>
        <p>
          For COD returns or exchanges, cash handling fees may apply again for reverse
          logistics and cash processing. Refund for COD orders, if applicable, will be
          issued via bank transfer or store credit after verification.
        </p>

        <h2 className="font-medium text-neutral-900 text-base">Customer Responsibility</h2>
        <p>
          The customer must ensure that the correct address and contact details are
          provided at the time of placing an order. Any delivery failure due to customer
          unavailability, incorrect address, or refusal to accept may result in Return to
          Origin handling and charges.
        </p>

        <h2 className="font-medium text-neutral-900 text-base">Product Availability</h2>
        <p>
          All items are subject to availability at the time of order confirmation.
          Inventory changes may cause discrepancies. In case of unavailability, the order
          may be cancelled or a suitable alternative may be offered.
        </p>

        <h2 className="font-medium text-neutral-900 text-base">Modification of Policy</h2>
        <p>
          We reserve the right to update or modify this Delivery, Returns, Exchange and
          COD Policy at any time without prior notice. Changes will apply to all new orders
          placed after the effective date of the updated policy.
        </p>

      </section>
    </LegalLayout>
  );
}
