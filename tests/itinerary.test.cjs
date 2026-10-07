/* eslint-disable @typescript-eslint/no-require-imports -- Compile project TypeScript in Node without another runtime dependency. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(relative) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = mod.require.bind(mod);
  mod.require = name => name.startsWith('@/') ? load(`src/${name.slice(2)}.ts`) : original(name);
  cache.set(filename, mod);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
  return mod.exports;
}
const catalog = load('src/data/itineraryDestinations.ts');
const { buildItinerary, validateTrip, dayConflicts, dayScheduleIssues, movePlanEvent, unscheduledPlaces, itineraryText, addDateDays, displayPlanDate, timeMinutes } = load('src/lib/itinerary.ts');
const places = catalog.itineraryCities.flatMap(city => city.places);
function trip(city = catalog.itineraryCities[0], days = '5') {
  return { destination: city.country, start: '2026-11-09', arrival: '10:00', departure: '18:00', pace: 'balanced', interests: ['Culture & history'], notes: '', stops: [{ id: 'stop-0', cityId: city.id, cityName: city.name, days, transferHours: '3', hotel: 'Hotel base' }] };
}

test('every catalog itinerary uses only selected places in its city, without repeats or time conflicts', () => {
  const ids = new Set();
  for (const city of catalog.itineraryCities) {
    for (const place of city.places) {
      assert.ok(!ids.has(place.id)); ids.add(place.id);
      assert.ok(place.source.startsWith('https://'));
    }
    const plan = buildItinerary(trip(city), places, city.places.map(place => place.id));
    const visits = plan.days.flatMap(day => {
      assert.deepEqual(dayConflicts(day), [], `${city.name}: ${day.date}`);
      assert.deepEqual(dayScheduleIssues(day, plan.places), [], `${city.name}: venue hours`);
      const entries = day.events.filter(event => event.type === 'place');
      assert.ok(entries.length <= 3);
      for (const entry of entries) assert.equal(plan.places.find(place => place.id === entry.placeId).cityId, day.cityId);
      return entries;
    });
    assert.equal(new Set(visits.map(event => event.placeId)).size, visits.length);
    assert.equal(visits.length + unscheduledPlaces(plan).length, city.places.length);
    assert.ok(visits.every(event => city.places.some(place => place.id === event.placeId)));
  }
});

test('foreign and out-of-route attractions cannot enter a schedule, including custom places', () => {
  assert.throws(() => buildItinerary(trip(), places, ['paris-1']), /selected destination/);
  const toronto = catalog.itineraryCities.find(city => city.id === 'toronto');
  assert.throws(() => buildItinerary(trip(toronto), places, ['vancouver-1']), /city stops/);
  const custom = { id: 'custom-1', country: 'France', cityId: 'doha', name: 'Wrong country', area: 'Centre', minutes: 60, interests: [] };
  assert.throws(() => buildItinerary(trip(), [custom], [custom.id]), /selected destination/);
});

test('multi-city allocation reserves transfers and restricts moving visits to their own city', () => {
  const toronto = catalog.itineraryCities.find(city => city.id === 'toronto');
  const details = trip(toronto, '3');
  details.stops.push({ id: 'stop-1', cityId: 'vancouver', cityName: 'Vancouver', days: '2', transferHours: '7', hotel: '' });
  const allowed = places.filter(place => place.country === 'Canada');
  const plan = buildItinerary(details, places, allowed.map(place => place.id));
  assert.deepEqual(plan.days.map(day => day.cityId), ['toronto', 'toronto', 'toronto', 'vancouver', 'vancouver']);
  const transfer = plan.days[3].events.find(event => event.title.includes('Travel from Toronto'));
  assert.equal(transfer.start, '09:00'); assert.equal(transfer.end, '16:00');
  assert.deepEqual(plan.days.flatMap(dayConflicts), []);
  const visit = plan.days.slice(0, 3).flatMap(day => day.events).find(event => event.type === 'place');
  assert.throws(() => movePlanEvent(plan, visit.id, plan.days[3].id), /same city/);
  const source = plan.days.find(day => day.events.some(event => event.id === visit.id));
  const target = plan.days.find(day => day.cityId === source.cityId && day.id !== source.id);
  const moved = movePlanEvent(plan, visit.id, target.id);
  assert.ok(moved.days.find(day => day.id === target.id).events.some(event => event.id === `${visit.id}-buffer`));
  assert.ok(!moved.days.find(day => day.id === source.id).events.some(event => event.id === visit.id || event.id === `${visit.id}-buffer`));
  assert.ok(plan.days.find(day => day.id === source.id).events.some(event => event.id === visit.id), 'Original plan is not mutated');
});

test('huge, fractional, missing and negative day counts fail before schedule allocation', () => {
  for (const days of ['1000000000', '3.5', '', '0', '-1', 'NaN', 'Infinity']) {
    assert.throws(() => buildItinerary(trip(undefined, days), places, ['doha-1']), /days/);
  }
  const details = trip();
  details.start = '2026-02-30';
  assert.ok(validateTrip(details).some(error => error.includes('date')));
  details.start = '2026-11-09'; details.arrival = '25:00';
  assert.throws(() => buildItinerary(details, places, ['doha-1']), /valid arrival/);
  assert.throws(() => buildItinerary(trip(), places, []), /Select at least/);
});

test('airport buffers bound sightseeing and an overfull day leaves visits explicitly unscheduled', () => {
  const details = trip(undefined, '1'); details.arrival = '06:00'; details.departure = '20:00';
  const plan = buildItinerary(details, places, ['doha-1', 'doha-2', 'doha-3', 'doha-4', 'doha-5']);
  assert.deepEqual(plan.days.flatMap(dayConflicts), []);
  assert.ok(unscheduledPlaces(plan).length > 0);
  for (const event of plan.days[0].events.filter(event => event.type === 'place')) {
    assert.ok(timeMinutes(event.start) >= 8 * 60);
    assert.ok(timeMinutes(event.end) <= 17 * 60);
  }
  details.arrival = '16:00'; details.departure = '18:00';
  assert.throws(() => buildItinerary(details, places, ['doha-1']), /at least 5 hours/);
});

test('short or invalid edits and overlaps are reported, with notes and pending visits in export', () => {
  const plan = buildItinerary(trip(), places, ['doha-1']);
  const day = plan.days[0];
  day.events.push({ id: 'meeting', title: 'Client meeting', start: '10:30', end: '11:30', type: 'personal', notes: 'Bring documents' });
  day.events.push({ id: 'bad', title: 'Bad slot', start: '', end: '09:00', type: 'personal', notes: '' });
  assert.ok(dayConflicts(day).some(issue => issue.includes('overlaps')));
  assert.ok(dayConflicts(day).some(issue => issue.includes('end time')));
  plan.details.notes = 'Vegetarian meals';
  day.notes = 'Confirmation ABC123';
  plan.days.forEach(entry => { entry.events = entry.events.filter(event => event.placeId !== 'doha-1'); });
  const exported = itineraryText(plan);
  for (const text of ['Vegetarian meals', 'Confirmation ABC123', 'Client meeting', 'Bring documents', 'NOT YET SCHEDULED', 'Souq Waqif', 'TIME CONFLICT']) assert.ok(exported.includes(text), text);
});

test('calendar dates are stable across timezones and leap/year boundaries', () => {
  assert.equal(addDateDays('2028-02-28', 1), '2028-02-29');
  assert.equal(addDateDays('2026-12-31', 1), '2027-01-01');
  assert.equal(displayPlanDate('2026-11-09'), 'Mon, 9 Nov 2026');
});

test('known weekly closures, holidays and visit windows constrain generation and manual edits', () => {
  const paris = catalog.itineraryCities.find(city => city.id === 'paris');
  const details = trip(paris, '1'); details.arrival = '06:00'; details.departure = '23:00';
  details.start = '2026-11-10'; // Tuesday: Louvre closed.
  let plan = buildItinerary(details, places, ['paris-2']);
  assert.equal(unscheduledPlaces(plan)[0].id, 'paris-2');
  details.start = '2026-12-25';
  plan = buildItinerary(details, places, ['paris-2', 'paris-3']);
  assert.equal(unscheduledPlaces(plan).length, 2);
  const doha = trip(undefined, '1'); doha.arrival = '06:00'; doha.departure = '23:00'; doha.start = '2026-11-13'; // Friday
  plan = buildItinerary(doha, places, ['doha-3']);
  const visit = plan.days[0].events.find(event => event.placeId === 'doha-3');
  assert.ok(timeMinutes(visit.start) >= timeMinutes('13:30'));
  visit.start = '09:00'; visit.end = '11:30';
  assert.ok(dayScheduleIssues(plan.days[0], plan.places).some(issue => issue.includes('within 13:30')));
});

test('late arrivals and midnight departures carry airport allowances across dates without overlaps', () => {
  const details = trip(); details.arrival = '23:59'; details.departure = '00:00';
  const plan = buildItinerary(details, places, ['doha-1', 'doha-2']);
  assert.deepEqual(plan.days.flatMap(dayConflicts), []);
  assert.ok(plan.days[0].notes.includes('23:59'));
  assert.ok(plan.days[1].events.some(event => event.title.includes('overnight arrival')));
  assert.ok(plan.days.at(-2).events.some(event => event.title.includes('overnight departure')));
  assert.ok(plan.days.at(-1).notes.includes('00:00'));
  assert.ok(itineraryText(plan).includes('Departure: 2026-11-13 00:00'));
  details.stops[0].days = '2'; details.departure = '01:00';
  assert.throws(() => buildItinerary(details, places, ['doha-1']), /at least 5 hours/);
});
