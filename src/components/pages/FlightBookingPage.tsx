import { TravelBookingForm } from "@/components/booking/TravelBookingForm";
import { bookingFonts } from "@/components/booking/fonts";
import styles from "@/components/booking/TravelBookingForm.module.css";

export function FlightBookingPage() {
  return (
    <section className={`${bookingFonts} ${styles.booking} ${styles.page}`}>
      <div className={styles.wrap}>
        <div className={styles.heading}>
          <h1>Flights &amp; Hotels</h1>
          <p>Request a fare or a stay directly — our reservations team confirms pricing and sends a quote by email and WhatsApp.</p>
        </div>
        <TravelBookingForm />
      </div>
    </section>
  );
}
