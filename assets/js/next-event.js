// Shows the next public openSUSE event from calendar.opensuse.org on the homepage.
// The banner stays hidden if the calendar can't be reached or has nothing upcoming.
(function () {
  'use strict';

  var banner = document.getElementById('next-event');
  if (!banner || !window.fetch) return;

  var CALENDAR = 'https://calendar.opensuse.org';
  var DAY = 24 * 60 * 60 * 1000;
  // Bootstrap Icons "camera-video" (MIT)
  var VIDEO_ICON = '<svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2zm11.5 5.175 3.5 1.556V4.269l-3.5 1.556zM2 4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z"/></svg>';

  function isHttpUrl(value) {
    try {
      var url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch (e) {
      return false;
    }
  }

  // Prefer events that start next; skip multi-day events (e.g. conferences)
  // that are already running so they don't hide a meeting for a whole week.
  function pickEvent(events, now) {
    var candidates = events.filter(function (e) {
      var starts = new Date(e.starts_at), ends = new Date(e.ends_at);
      var running = starts <= now;
      return !(running && ends - starts > DAY);
    });
    return candidates[0] || events[0];
  }

  function formatWhen(starts, ends) {
    var sameDay = starts.toDateString() === ends.toDateString();
    if (ends - starts > DAY || !sameDay) {
      var dateOnly = { weekday: 'short', day: 'numeric', month: 'short' };
      return starts.toLocaleDateString(undefined, dateOnly) + ' – ' + ends.toLocaleDateString(undefined, dateOnly);
    }
    var day = starts.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    var from = starts.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    var to = ends.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    return day + ', ' + from + ' – ' + to;
  }

  function joinLabel(url) {
    var host = new URL(url).hostname;
    return (host === 'meet.opensuse.org' || host === 'meet.jit.si') ? 'Join with Jitsi' : 'Join meeting';
  }

  fetch(CALENDAR + '/main/upcoming.json?limit=5')
    .then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .then(function (events) {
      if (!Array.isArray(events) || events.length === 0) return;

      var now = new Date();
      var event = pickEvent(events, now);
      var starts = new Date(event.starts_at), ends = new Date(event.ends_at);

      banner.querySelector('[data-label]').textContent = starts <= now ? 'Happening now:' : 'Next community event:';

      var name = banner.querySelector('[data-name]');
      name.textContent = event.name;
      if (isHttpUrl(event.url)) name.href = event.url;

      banner.querySelector('[data-when]').textContent = formatWhen(starts, ends);

      if (event.meeting_url && isHttpUrl(event.meeting_url)) {
        var join = banner.querySelector('[data-join]');
        join.href = event.meeting_url;
        join.textContent = joinLabel(event.meeting_url);
        join.insertAdjacentHTML('afterbegin', VIDEO_ICON + ' ');
        join.hidden = false;
      }

      banner.hidden = false;
    })
    .catch(function () { /* calendar unavailable, keep the banner hidden */ });
})();
