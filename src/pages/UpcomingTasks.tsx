import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Task = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
};

const UpcomingTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const { data, error } = await (supabase as any)
      .from('tasks')
      .select('*')
      .order('completed', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load tasks');
    } else {
      setTasks((data as Task[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    const { data: userData } = await supabase.auth.getUser();
    const { data: inserted, error } = await (supabase as any)
      .from('tasks')
      .insert({ title, created_by: userData.user?.id })
      .select()
      .single();
    setAdding(false);
    if (error) {
      toast.error('Failed to add task');
      return;
    }
    if (inserted) {
      setTasks((prev) =>
        prev.some((t) => t.id === (inserted as Task).id)
          ? prev
          : [inserted as Task, ...prev]
      );
    }
    setNewTitle('');
  };

  const toggleTask = async (task: Task) => {
    // optimistic
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
    );
    const { error } = await (supabase as any)
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id);
    if (error) {
      toast.error('Failed to update task');
      load();
    }
  };

  const deleteTask = async (task: Task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    const { error } = await (supabase as any).from('tasks').delete().eq('id', task.id);
    if (error) {
      toast.error('Failed to delete task');
      load();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="icon" aria-label="Back to gardens">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Upcoming tasks</h1>
        </div>

        <form onSubmit={addTask} className="flex gap-2">
          <Input
            placeholder="Add a new task…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={adding}
          />
          <Button type="submit" disabled={adding || !newTitle.trim()} className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </form>

        <div className="rounded-lg border bg-card divide-y">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading tasks…
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No tasks yet. Add the first one above.
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-4 py-3 group"
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task)}
                  aria-label={
                    task.completed ? 'Mark task as incomplete' : 'Mark task as complete'
                  }
                />
                <span
                  className={cn(
                    'flex-1 text-sm',
                    task.completed && 'line-through text-muted-foreground'
                  )}
                >
                  {task.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteTask(task)}
                  aria-label="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UpcomingTasks;