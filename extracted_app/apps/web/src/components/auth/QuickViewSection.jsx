import React from 'react';
import { FileText, MessageCircle, Activity, Users, FileCheck } from 'lucide-react';

const QuickViewSection = () => {
  const benefits = [
    {
      icon: FileText,
      title: 'Create in Minutes',
      description: 'Generate professional quotations instantly.'
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp Ready',
      description: 'Share directly with clients via WhatsApp.'
    },
    {
      icon: Activity,
      title: 'Track Status',
      description: 'Monitor pending, accepted, or rejected quotes.'
    },
    {
      icon: Users,
      title: 'Manage Clients',
      description: 'Keep all your client details organized.'
    },
    {
      icon: FileCheck,
      title: 'PDF Exports',
      description: 'Download clean, branded PDF documents.'
    }
  ];

  return (
    <div className="w-full mb-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Built for Photographers</h2>
        <p className="text-muted-foreground text-sm">Everything you need to manage your photography business.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {benefits.map((benefit, index) => (
          <div key={index} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 shadow-sm">
            <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
              <benefit.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">{benefit.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickViewSection;