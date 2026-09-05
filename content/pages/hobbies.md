# Motorbikes

I have loved motorbikes since I was 16 years old. My dream bike was a baby blue Gen 1 BMW S1000RR. I love modifying and working on my own bikes (legally, of course!). One day, I hope to take them to the track.

## My Collection

### 2008 ZX10r - Limited Edition Orange
![ZX10r](/assets/photos/zx10r-1.jpg)
- **Specs**: 200BHP, 200KG, 200MPH.
- **Status**: Top Dog.

### 2012 Aprilia Tuono 1000 APRC v4
![Tuono](/assets/photos/tuono-1000-1.jpg)
- **Specs**: 167BHP, 200KG.
- **Mods**: Exhaust, air filter, APRC race-tune ECU.

### 2016 ER6N
![ER6N](/assets/photos/er6n-1.jpg)
- **Specs**: 70BHP, 180KG.
- **Mods**: 2019 Engine Mod.

### 2003 ZX12r (Blue)
![ZX12r Blue](/assets/photos/zx12r-blue-1.jpg)
- **Specs**: N/A BHP, 230KG, N/A MPH.
- **Status**: Broken - I blew the engine up!

### 2003 ZX12r (Black)
![ZX12r Black](/assets/photos/zx12r-black-1.jpg)
- **Specs**: 179WHP (200+ BHP), 220KG, 190MPH.

---

# Computer Technology

As a software engineer, technology is a huge part of my life.
- **OS**: Fedora 44 Linux (Daily Driver).
- **Gaming**: Dual-boot with Windows 11 for anti-cheat games.
- **The estate**: Origin (the workstation), Oracle (Galaxy Book2 Pro on Omarchy), Vortex (the always-on server), ProDure (a Dell R620 — "professional endurance"), and an Inspiron laptop running Proxmox.

## GPU History
I'm a big fan of AMD GPUs - they offer the best bang for the buck on the used market!

### Red Devil Limited Edition 7900XTX
![7900XTX](/assets/photos/7900xtx-1.jpg)

### AMD Fury X
![Fury X](/assets/photos/fury-1.jpg)

### MSI 290x Lightning Edition
![290x Lightning](/assets/photos/290x-lightning-1.jpg)

### MSI 290x Vapor
![290x Vapor](/assets/photos/290x-vapor-2.jpg)

### Radeon HD 7990
![7990](/assets/photos/7990-1.jpg)

### Radeon HD 7970
![7970](/assets/photos/7970-1.jpg)

### MSI Frozr 7950
![7950](/assets/photos/7950-2.jpg)
- The 'coolest' card I had.

### Radeon HD 7770
![7770](/assets/photos/7770-1.jpg)
- My first cards (1GB & 2GB).

### Vega 56
![Vega 56](/assets/photos/vega56-1.jpg)

---

# Homelab

I run one always-on server and a handful of machines around it, and it has taught me more than any course. Everything on it is self-hosted, reached only over a private mesh network, and written down as decision records so I can't quietly re-learn the same lesson twice.

## What it taught me
- **Mesh networking**: Tailscale across every device, HTTPS front doors served over the mesh, nothing exposed to the public internet.
- **Selective VPN egress**: Proton VPN for exactly the containers that need it, by sharing a network namespace, not by routing the whole box.
- **Containers without Kubernetes**: rootless Podman under systemd, two users sharing one port space, and what breaks when they collide.
- **Storage that matches the workload**: per-drive btrfs tiers, and why a database on a consumer SSD stalls — power-loss-protected drives fixed a p99 fsync of 25 ms down to 3 ms.
- **Backups are the real risk**: designing a 3-2-1 plan when the filesystem has no cross-drive parity.
- **One GPU, many consumers**: keeping a single model resident on an 8 GB card and making every service consume it through one alias.
- **Observability**: Prometheus and Grafana, exporters per user, and a monitor that speaks even when everything is fine — because one that only speaks on failure is indistinguishable from a dead one.
- **Decision records**: forty-two of them. The habit outlasts the hardware.

---

# Gym

Staying fit is important to me.

## Body Stats
- **Height**: 5ft 7inches
- **Weight**: 72kg (down from 99kg)

## Strength Feats
- **Bench**: 120kg
- **Deadlift**: 180kg
- **Squat**: 140kg

## Goals
- To get bigger, stronger, and ultimately fitter.
