import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const CommunityRules: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
            Back to gardens
          </Button>
        </Link>

        <header className="space-y-3 text-center">
          <h1 className="text-4xl font-bold text-foreground">Community Guidelines</h1>
        </header>

        <article className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground">
          <section className="space-y-2">
            <h2 className="text-2xl font-semibold">🥕 How to join</h2>
            <p className="text-muted-foreground">
              Just let us know in the group chat "Groene vingers" in De Groene Kaap how you would like to
              participate. Participation can be planting, watering, maintenance, decorating,
              pruning etc. There are no obligations or fees for joining, but help however and when
              you can. There is always something to do in the garden!
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold">🌿 Shared plants</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Everything in the garden is shared.</li>
              <li>Be mindful of others—leave enough for everyone to enjoy when harvesting.</li>
              <li>
                If you want to harvest, please contribute actively by helping maintain the garden.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold">🌱 Respect the Space</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Treat the garden as a shared, community space.</li>
              <li>Clean up after yourself and return tools to their proper place.</li>
              <li>Be mindful of noise levels and nearby residents.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold">🌼 Sustainability First</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Avoid chemical pesticides and fertilizers; opt for organic methods.</li>
              <li>Respect wildlife and pollinators—this is their space too.</li>
              <li>Compost garden waste where possible.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold">📅 Communication & Community</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Stay informed through our group chat.</li>
              <li>If you're unsure about something (harvesting, planting, helping), just ask!</li>
              <li>Be kind, inclusive, and respectful—this garden belongs to all of us.</li>
            </ul>
          </section>
        </article>
      </div>
    </div>
  );
};

export default CommunityRules;