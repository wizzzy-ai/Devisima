import { CheckCircle, Shield, Eye, Lock } from "lucide-react";

export function WhyDevisima() {
  const benefits = [
    {
      icon: CheckCircle,
      title: "Ready-to-Use",
      description: "Start with working software instead of building everything from zero.",
    },
    {
      icon: Shield,
      title: "Verified Creators",
      description: "Discover products from developers and creators with transparent profiles and product information.",
    },
    {
      icon: Eye,
      title: "Live Previews",
      description: "See what you're buying before you purchase.",
    },
    {
      icon: Lock,
      title: "Secure Downloads",
      description: "Purchased products are securely delivered through your account.",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Built for people who want to build faster.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to discover, purchase, and use quality digital products.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="text-center">
              <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <benefit.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
