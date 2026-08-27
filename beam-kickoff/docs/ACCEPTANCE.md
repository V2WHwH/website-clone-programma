# ACCEPTANCE — the one scenario that matters

The product is production-ready when this runs, unassisted, repeatedly. Not when the feature list
is complete.

Run it as written. Every unchecked box is a blocker, not a nice-to-have.

---

## Setup

A new Holobox is installed in Amsterdam. Nobody involved has seen the system before.

- [ ] Receiver is installed from the installer, not from a development command
- [ ] On first launch the receiver displays a pairing code
- [ ] An administrator opens Beam Cloud, scans the code, selects the organisation, names the device
- [ ] The device appears **ONLINE** in the dashboard within seconds
- [ ] No terminal, no config file editing, no manual credential entry at any point

## The session

An employee in New York is invited.

- [ ] The invitation arrives as a link that works on both laptop and smartphone
- [ ] Opening it requires no software installation
- [ ] Camera and microphone permission are requested once, clearly
- [ ] A preview appears showing the person full-body
- [ ] The destination is visible before the camera opens — the sender always knows where they are going
- [ ] A network test runs and returns an honest verdict
- [ ] The system selects the highest stable quality automatically
- [ ] The employee presses GO LIVE
- [ ] Within seconds they appear full-body in the Holobox in Amsterdam

## During the session

- [ ] The employee hears the people in Amsterdam
- [ ] The people in Amsterdam hear the employee
- [ ] No echo, no feedback loop
- [ ] The employee sees a return feed of the Amsterdam side
- [ ] The status strip shows real, live values — duration, connection state, resolution, fps, bitrate
- [ ] Settings that cannot be changed safely mid-session are visibly disabled
- [ ] The connection stays stable for at least 30 minutes

## Under stress

- [ ] Bandwidth is throttled: quality steps down, the session does **not** end
- [ ] Bandwidth recovers: quality steps back up, controlled, without flapping
- [ ] The network is cut entirely: the Holobox shows fallback content, never an error, never Windows
- [ ] The network returns: reconnection happens silently, with no human action

## After

- [ ] The employee presses STOP
- [ ] The Holobox returns automatically to its configured content
- [ ] The session appears in the dashboard with duration, resolution, average bitrate, average
      latency, packet loss, dropped frames, reconnection count
- [ ] The full session is reconstructable from logs via its session ID

## Recovery

- [ ] Power is cut to the Holobox PC and restored
- [ ] Windows boots, receiver starts, device authenticates, display is found, fallback content plays,
      cloud connection is restored, device shows ONLINE
- [ ] Total time from power-on to ONLINE is recorded
- [ ] No human action was required at any point

---

## The honesty check

Run alongside the above:

- [ ] The diagnostic view reports the resolution at every stage: capture, encoder input, encoded
      output, transport, decode, render, physical output
- [ ] Every stage reports the same resolution
- [ ] If the UI says 4K, all seven stages say 2160 × 3840 (or 3840 × 2160 in landscape)

If any stage disagrees with the label shown to the user, the build fails this acceptance test
regardless of how well everything else performed.
