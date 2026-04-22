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
          <p className="text-lg text-muted-foreground">
            For our neighbourhood vegetable garden
          </p>
        </header>

        <article className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground">
          <section className="space-y-2">
            <h2 className="text-2xl font-semibold">🌱 Respect the Space</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Treat the garden as a shared, community space.</li>
              <li>Clean up after yourself and return tools to their proper place.</li>
              <li>Be mindful of noise levels and nearby residents.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold">🌿 Shared Plants & Herbs</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Feel free to harvest from shared herbs and plants, but take only what you need.</li>
              <li>Be mindful of others—leave enough for everyone to enjoy.</li>
              <li>
                If you harvest regularly, consider contributing by helping maintain these plants
                (watering, pruning, replanting).
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold">🥕 Personal Plots</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Respect clearly marked personal plots—do not harvest from them without permission.</li>
              <li>If you have your own plot, keep it maintained (weeded, watered, and tidy).</li>
              <li>Label your plants if possible to avoid confusion.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold">🤝 Helping Hands Welcome</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>You don't need to have your own plot to be part of the garden!</li>
              <li>
                Volunteers are always appreciated for general tasks like watering, composting,
                weeding, and repairs.
              </li>
              <li>Join group workdays or contribute whenever you can.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold">💧 Water & Resources</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Use water mindfully—especially during dry periods.</li>
              <li>Share tools and supplies fairly and report any damage.</li>
              <li>If something runs out or breaks, let the group know.</li>
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
              <li>Stay informed through our group chat</li>
              <li>If you're unsure about something (harvesting, planting, helping), just ask!</li>
              <li>Be kind, inclusive, and respectful—this garden belongs to all of us.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl font-semibold">🌻 Final Thought</h2>
            <p className="text-muted-foreground">
              This garden thrives because of shared care and goodwill. Whether you grow your own
              vegetables, harvest a few herbs, or simply lend a hand, your contribution matters.
            </p>
            <p className="text-muted-foreground font-medium">Let's grow together 🌱</p>
          </section>
        </article>
      </div>
    </div>
  );
};

export default CommunityRules;