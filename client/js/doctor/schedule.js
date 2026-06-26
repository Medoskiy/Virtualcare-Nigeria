import { doctorsApi, appointmentsApi } from '../shared/api.js';
import { toast } from '../shared/toast.js';

export const ALL_TIME_SLOTS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

export const SCHEDULE_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const DAY_TO_FULL = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday',
  FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday'
};

const DAY_FROM_SHORT = {
  Mon: 'MON', Tue: 'TUE', Wed: 'WED', Thu: 'THU', Fri: 'FRI', Sat: 'SAT', Sun: 'SUN',
  Monday: 'MON', Tuesday: 'TUE', Wednesday: 'WED', Thursday: 'THU',
  Friday: 'FRI', Saturday: 'SAT', Sunday: 'SUN'
};

function toDayKey(day) {
  if (!day) return '';
  if (SCHEDULE_DAYS.includes(day)) return day;
  const short = day.slice(0, 3);
  return DAY_FROM_SHORT[day] || DAY_FROM_SHORT[short] || short.toUpperCase();
}

function buildScheduleMap(user) {
  const map = {};
  (user.schedule || []).forEach((d) => {
    const dayKey = toDayKey(d.day);
    if (!dayKey) return;
    map[dayKey] = (d.slots || []).map((s) => {
      const t = s.startTime || s.time || '';
      return t.length === 4 ? `0${t}` : t.slice(0, 5);
    }).filter(Boolean);
  });
  return map;
}

function getBookedSlots(appts) {
  const set = new Set();
  appts
    .filter((a) => ['pending', 'confirmed', 'active'].includes(a.status))
    .forEach((a) => {
      const d = new Date(a.scheduledAt);
      const day = d.toLocaleDateString('en-NG', { weekday: 'short', timeZone: 'Africa/Lagos' });
      const time = d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Lagos' }).slice(0, 5);
      const dayKey = toDayKey(day);
      const hour = time.slice(0, 2) + ':00';
      set.add(`${dayKey}-${hour}`);
      set.add(`${dayKey}-${time}`);
    });
  return set;
}

function renderScheduleGrid(container, scheduleData, bookedSlots, activeSession) {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-NG', { weekday: 'short', timeZone: 'Africa/Lagos' }).toUpperCase().slice(0, 3);
  const currentHour = parseInt(
    now.toLocaleTimeString('en-NG', { hour: '2-digit', hour12: false, timeZone: 'Africa/Lagos' }),
    10
  );

  let html = '<div class="schedule-grid">';

  html += '<div class="schedule-day-header schedule-corner"></div>';
  SCHEDULE_DAYS.forEach((day) => {
    const isToday = day === currentDay;
    html += `<div class="schedule-day-header${isToday ? ' schedule-today' : ''}">${day}${isToday ? ' 📍' : ''}</div>`;
  });

  ALL_TIME_SLOTS.forEach((time) => {
    const hour = parseInt(time.split(':')[0], 10);
    const isCurrentHour = hour === currentHour;

    html += `<div class="schedule-time-label${isCurrentHour ? ' schedule-now' : ''}">${time}</div>`;

    SCHEDULE_DAYS.forEach((day) => {
      const isAvailable = (scheduleData[day] || []).includes(time);
      const isBooked = bookedSlots.has(`${day}-${time}`);
      const isInSession = activeSession && day === currentDay && hour === currentHour;
      const isOffHours = hour >= 0 && hour < 6;

      let slotClass = 'unavailable';
      let slotLabel = '';

      if (isInSession) {
        slotClass = 'in-session';
        slotLabel = '🔴 Live';
      } else if (isBooked) {
        slotClass = 'booked';
        slotLabel = '✕';
      } else if (isAvailable) {
        slotClass = 'available';
        slotLabel = '✓';
      } else if (isOffHours) {
        slotClass = 'off-hours';
        slotLabel = '—';
      }

      const canToggle = !isBooked && !isInSession && !isOffHours;
      html += `<div class="schedule-slot ${slotClass}" data-day="${day}" data-time="${time}" data-toggle="${canToggle ? '1' : '0'}" title="${day} ${time}">${slotLabel}</div>`;
    });
  });

  html += '</div>';

  html += `
    <div class="schedule-legend">
      <div class="legend-item"><div class="legend-dot" style="background:#dcfce7;border:1px solid #166534"></div>Available</div>
      <div class="legend-item"><div class="legend-dot" style="background:#fff;border:1px solid #e2e8f0"></div>Unavailable</div>
      <div class="legend-item"><div class="legend-dot" style="background:#fee2e2;border:1px solid #991b1b"></div>Booked</div>
      <div class="legend-item"><div class="legend-dot" style="background:#dc2626"></div>In Session 🔴</div>
    </div>`;

  container.innerHTML = html;
}

function toggleScheduleSlot(el, scheduleData) {
  if (el.dataset.toggle !== '1') return;

  const { day, time } = el.dataset;
  if (!scheduleData[day]) scheduleData[day] = [];

  const index = scheduleData[day].indexOf(time);
  if (index === -1) {
    scheduleData[day].push(time);
    el.classList.remove('unavailable');
    el.classList.add('available');
    el.textContent = '✓';
  } else {
    scheduleData[day].splice(index, 1);
    el.classList.remove('available');
    el.classList.add('unavailable');
    el.textContent = '';
  }
}

export async function renderSchedule(el, user) {
  const scheduleData = buildScheduleMap(user);
  const appts = (await appointmentsApi.doctorAll()).data.appointments || [];
  const bookedSlots = getBookedSlots(appts);
  const activeSession = appts.some((a) => a.status === 'active');

  el.innerHTML = `
    <h1>Schedule</h1>
    <div class="card schedule-card">
      <p>Session duration: 45–55 minutes · Buffer: 10 min · Click slots to toggle availability</p>
      <div class="schedule-grid-wrap" id="scheduleGrid"></div>
      <button type="button" class="btn btn-primary" id="save-sched">Save Schedule</button>
    </div>
  `;

  const gridWrap = el.querySelector('#scheduleGrid');
  renderScheduleGrid(gridWrap, scheduleData, bookedSlots, activeSession);

  gridWrap.querySelectorAll('.schedule-slot[data-toggle="1"]').forEach((slot) => {
    slot.addEventListener('click', () => toggleScheduleSlot(slot, scheduleData));
  });

  el.querySelector('#save-sched').addEventListener('click', async () => {
    const schedule = SCHEDULE_DAYS.map((day) => ({
      day: DAY_TO_FULL[day],
      slots: (scheduleData[day] || []).map((time) => ({ startTime: time, endTime: time, available: true }))
    }));
    try {
      await doctorsApi.updateSchedule(schedule);
      toast('Schedule saved successfully! ✅', 'success');
    } catch {
      toast('Could not save schedule. Please try again.', 'error');
    }
  });
}
