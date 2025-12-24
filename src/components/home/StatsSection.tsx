import { BookOpen, Users, Award, Target } from 'lucide-react';

const stats = [
  { icon: BookOpen, value: '+1000', label: 'سؤال' },
  { icon: Users, value: '+5000', label: 'مختبر' },
  { icon: Award, value: '43', label: 'مادة' },
  { icon: Target, value: '85%', label: 'نسبة النجاح' },
];

export function StatsSection() {
  return (
    <section className="py-16 bg-card border-y">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
                <stat.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</p>
              <p className="text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
