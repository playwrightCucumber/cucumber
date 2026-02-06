import { NextRequest, NextResponse } from 'next/server';
import { getSchedules, addSchedule, updateSchedule, deleteSchedule, saveSchedules } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { runTests } from '@/lib/test-runner';
import cron from 'node-cron';

export const dynamic = 'force-dynamic';

// Store active scheduled tasks
const scheduledTasks = new Map<string, cron.ScheduledTask>();

export async function GET() {
  try {
    const schedules = await getSchedules();
    return NextResponse.json(schedules);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, tags, environment, cronExpression, enabled } = body;

    if (!name || !tags || !environment || !cronExpression) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const schedule = {
      id: uuidv4(),
      name,
      tags,
      environment,
      cronExpression,
      enabled: enabled ?? true,
      nextRun: new Date().toISOString(),
    };

    await addSchedule(schedule);

    if (schedule.enabled) {
      startScheduledTask(schedule);
    }

    return NextResponse.json(schedule);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, enabled } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const schedules = await getSchedules();
    const schedule = schedules.find(s => s.id === id);

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Update enabled state
    await updateSchedule(id, { enabled });

    if (enabled && !scheduledTasks.has(id)) {
      startScheduledTask(schedule);
    } else if (!enabled) {
      stopScheduledTask(id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    stopScheduledTask(id);
    await deleteSchedule(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}

function startScheduledTask(schedule: any) {
  if (scheduledTasks.has(schedule.id)) {
    return;
  }

  const task = cron.schedule(schedule.cronExpression, async () => {
    console.log(`Running scheduled test: ${schedule.name}`);
    await runTests(schedule.tags, schedule.environment);
  }, {
    scheduled: true,
  });

  scheduledTasks.set(schedule.id, task);
}

function stopScheduledTask(id: string) {
  const task = scheduledTasks.get(id);
  if (task) {
    task.stop();
    scheduledTasks.delete(id);
  }
}

// Initialize scheduled tasks on startup
async function initScheduledTasks() {
  const schedules = await getSchedules();
  for (const schedule of schedules) {
    if (schedule.enabled) {
      startScheduledTask(schedule);
    }
  }
}

initScheduledTasks();
