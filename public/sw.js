self.addEventListener("push", (event) => {
  const body = "Before the day takes over.";
  event.waitUntil(
    self.registration.showNotification("Polaris", {
      body,
      data: { url: "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification && event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of allClients) {
        if ("navigate" in client) await client.navigate(url);
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })(),
  );
});

