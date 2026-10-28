self.addEventListener('push', function (ev) {
  var p = {};
  try { p = ev.data ? ev.data.json() : {}; }
  catch (e) { try { p = { body: ev.data.text() }; } catch (_) {} }
  var d = Object.assign({}, p.data || {}, p.notification || {});
  var title = d.title || p.title || '🔔 রাজশাহী স্বাস্থ্যসেবা';
  var urgent = d.urg === 'u';
  var opts = {
    body: d.body || p.body || '',
    tag: d.tag || 'rsh',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    renotify: true,
    requireInteraction: true,
    vibrate: urgent ? [400, 150, 400, 150, 400, 150, 400] : [250, 120, 250, 120, 250],
    timestamp: Date.now(),
    data: { go: d.go || '', kind: d.kind || '' }
  };
  ev.waitUntil(Promise.all([
    self.registration.showNotification(title, opts),
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      list.forEach(function (c) {
        c.postMessage({ type: 'rsh-push', kind: d.kind || '', go: d.go || '', open: false });
      });
    })
  ]));
});

self.addEventListener('notificationclick', function (ev) {
  ev.notification.close();
  var go = (ev.notification.data && ev.notification.data.go) || '';
  var url = self.registration.scope + (go ? '?go=' + encodeURIComponent(go) : '');
  ev.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if ('focus' in c) {
          c.postMessage({ type: 'rsh-push', kind: '', go: go, open: true });
          return c.focus();
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(url) : undefined;
    })
  );
});
