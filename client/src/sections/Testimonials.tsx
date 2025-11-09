const testimonials = [
  {
    name: 'Jordan Lee',
    role: 'Head of Operations, Meridian Clinics',
    quote: 'We replaced three full-time receptionists within two weeks. Patients never wait on hold anymore.'
  },
  {
    name: 'Fatima Alvarez',
    role: 'COO, Apex Legal',
    quote: 'Amunet spun up custom voice greetings and intake workflows in minutes. Billing and compliance were automatic.'
  },
  {
    name: 'Mason Grant',
    role: 'Founder, Velocity Labs',
    quote: 'The onboarding wizard grabbed everything from our website and deployed a working call flow instantly.'
  }
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="bg-transparent py-24 text-slate-900">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100">
              <p className="text-sm text-slate-500">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="mt-6">
                <p className="font-display text-sm text-slate-900">{testimonial.name}</p>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
