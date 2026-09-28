const builders = [
  [
    "demo-builder-meridian",
    "demo+meridian@brickline.example",
    "Kavya Rao",
    "Meridian Habitat",
    "Bandra Kurla Complex, Mumbai",
  ],
  [
    "demo-builder-northstar",
    "demo+northstar@brickline.example",
    "Arjun Mehta",
    "Northstar Realty",
    "Baner, Pune",
  ],
  [
    "demo-builder-cedarline",
    "demo+cedarline@brickline.example",
    "Nisha Iyer",
    "Cedarline Developments",
    "Whitefield, Bengaluru",
  ],
  [
    "demo-builder-deccan",
    "demo+deccan@brickline.example",
    "Rohan Reddy",
    "Deccan Urbanworks",
    "Financial District, Hyderabad",
  ],
  [
    "demo-builder-aster",
    "demo+aster@brickline.example",
    "Meera Shah",
    "Aster Districts",
    "Wakad, Pune",
  ],
] as const;

const verifiedDemoBuilders = new Set([
  "demo-builder-meridian",
  "demo-builder-northstar",
  "demo-builder-cedarline",
]);

async function syncDemoVerification(db: D1Database, verifiedAt: number) {
  await db.batch(
    builders.map(([id]) =>
      db
        .prepare(
          "UPDATE builder_access_requests SET verified_at = ? WHERE user_id = ? AND is_demo = 1",
        )
        .bind(verifiedDemoBuilders.has(id) ? verifiedAt : null, id),
    ),
  );
}

const projects = [
  [
    "demo-project-meridian-one",
    "demo-builder-meridian",
    "Meridian One BKC",
    "Bandra East, Mumbai",
    "Plot C-18, G Block, Bandra Kurla Complex",
    "Construction started",
    "Meridian Habitat",
    920,
    312,
    "Q4 2028",
    19.0596,
    72.8656,
    184,
    "Illustrative premium mixed-use district with office, retail, and residential phases.",
  ],
  [
    "demo-project-powai-terraces",
    "demo-builder-meridian",
    "Powai Lake Terraces",
    "Powai, Mumbai",
    "Saki Vihar Road, Powai",
    "Approval stage",
    "Meridian Habitat",
    680,
    224,
    "Q2 2029",
    19.1176,
    72.906,
    97,
    "Illustrative lakeside residential project planned around pedestrian courtyards.",
  ],
  [
    "demo-project-kothrud-commons",
    "demo-builder-northstar",
    "Kothrud Commons",
    "Kothrud, Pune",
    "Paud Road, Kothrud",
    "Redevelopment",
    "Northstar Realty",
    410,
    146,
    "Q1 2028",
    18.5074,
    73.8077,
    151,
    "Illustrative cooperative-housing redevelopment with phased resident handover.",
  ],
  [
    "demo-project-hinjawadi-square",
    "demo-builder-northstar",
    "Hinjawadi Square",
    "Hinjawadi, Pune",
    "Phase 2 Road, Rajiv Gandhi Infotech Park",
    "New construction",
    "Northstar Realty",
    560,
    410,
    "Q3 2029",
    18.5913,
    73.7389,
    83,
    "Illustrative transit-oriented residential and neighbourhood retail development.",
  ],
  [
    "demo-project-whitefield-grove",
    "demo-builder-cedarline",
    "Whitefield Grove",
    "Whitefield, Bengaluru",
    "ITPL Main Road, Whitefield",
    "Construction started",
    "Cedarline Developments",
    740,
    520,
    "Q4 2028",
    12.9698,
    77.75,
    226,
    "Illustrative family housing campus with shared work and recreation spaces.",
  ],
  [
    "demo-project-sarjapur-exchange",
    "demo-builder-cedarline",
    "Sarjapur Exchange",
    "Sarjapur Road, Bengaluru",
    "Outer Ring Road junction, Sarjapur",
    "Approval stage",
    "Cedarline Developments",
    630,
    468,
    "Q2 2030",
    12.86,
    77.786,
    74,
    "Illustrative mixed-use community proposed around a new mobility corridor.",
  ],
  [
    "demo-project-gachibowli-central",
    "demo-builder-deccan",
    "Gachibowli Central",
    "Gachibowli, Hyderabad",
    "Financial District Road, Gachibowli",
    "New construction",
    "Deccan Urbanworks",
    810,
    390,
    "Q1 2030",
    17.4401,
    78.3489,
    119,
    "Illustrative high-density residential project near the financial district.",
  ],
  [
    "demo-project-kokapet-vista",
    "demo-builder-deccan",
    "Kokapet Vista",
    "Kokapet, Hyderabad",
    "Neopolis Road, Kokapet",
    "Construction started",
    "Deccan Urbanworks",
    950,
    610,
    "Q3 2029",
    17.3948,
    78.3375,
    207,
    "Illustrative multi-tower development with active construction milestones.",
  ],
  [
    "demo-project-wakad-yards",
    "demo-builder-aster",
    "Wakad Yards",
    "Wakad, Pune",
    "Datta Mandir Road, Wakad",
    "Redevelopment",
    "Aster Districts",
    360,
    180,
    "Q4 2027",
    18.598,
    73.762,
    138,
    "Illustrative neighbourhood renewal project with upgraded community facilities.",
  ],
  [
    "demo-project-thanisandra-park",
    "demo-builder-aster",
    "Thanisandra Park",
    "Thanisandra, Bengaluru",
    "Thanisandra Main Road",
    "New construction",
    "Aster Districts",
    495,
    330,
    "Q2 2029",
    13.055,
    77.633,
    92,
    "Illustrative mid-rise housing development connected to emerging social infrastructure.",
  ],
] as const;

const signals = [
  [
    "demo-signal-bkc",
    "Construction activity expands near BKC",
    "Bandra East, Mumbai",
    "Maharashtra",
    "Construction started",
    "Two major phases in the demo workspace now show active construction milestones.",
    "Illustrative demo activity feed",
    "2026-09-12",
  ],
  [
    "demo-signal-kothrud",
    "Redevelopment cluster forming in Kothrud",
    "Kothrud, Pune",
    "Maharashtra",
    "Redevelopment",
    "The demo dataset shows multiple renewal opportunities around established residential corridors.",
    "Illustrative demo activity feed",
    "2026-09-08",
  ],
  [
    "demo-signal-whitefield",
    "Whitefield delivery pipeline advances",
    "Whitefield, Bengaluru",
    "Karnataka",
    "Construction started",
    "Recorded demo milestones indicate growing residential supply near employment hubs.",
    "Illustrative demo activity feed",
    "2026-09-03",
  ],
  [
    "demo-signal-kokapet",
    "Kokapet pipeline gains momentum",
    "Kokapet, Hyderabad",
    "Telangana",
    "New construction",
    "The demo workspace highlights a growing mix of planned and active high-density projects.",
    "Illustrative demo activity feed",
    "2026-08-29",
  ],
] as const;

export async function ensureDemoData(db: D1Database) {
  const requestedAt = Date.parse("2026-06-01T09:00:00Z");
  const updatedAt = Date.parse("2026-09-20T09:00:00Z");
  const seeded = await db
    .prepare("SELECT id FROM registered_projects WHERE id = ? LIMIT 1")
    .bind("demo-project-meridian-one")
    .first();
  if (seeded) {
    await syncDemoVerification(db, requestedAt);
    return;
  }
  const statements: D1PreparedStatement[] = [];

  for (const [id, email, name, company, address] of builders) {
    statements.push(
      db
        .prepare(
          "INSERT OR IGNORE INTO builder_access_requests (user_id, email, name, company, status, requested_role, agent_access, builder_access, client_access, requested_at, reviewed_at, reviewed_by, consent_version, consent_at, business_address, contact_person, verified_at, is_demo) VALUES (?, ?, ?, ?, 'approved', 'Builder', 1, 1, 1, ?, ?, 'system:demo-seed', 'demo-dataset', ?, ?, ?, ?, 1)",
        )
        .bind(
          id,
          email,
          name,
          company,
          requestedAt,
          requestedAt,
          requestedAt,
          address,
          name,
          verifiedDemoBuilders.has(id) ? requestedAt : null,
        ),
    );
  }

  for (const [
    id,
    owner,
    name,
    area,
    address,
    status,
    builder,
    value,
    homes,
    completion,
    latitude,
    longitude,
    views,
    description,
  ] of projects) {
    statements.push(
      db
        .prepare(
          "INSERT OR IGNORE INTO registered_projects (id, owner_user_id, name, area, country, site_address, currency, status, builder, value, homes, description, completion, latitude, longitude, published, view_count, is_demo, created_at, updated_at) VALUES (?, ?, ?, ?, 'India', ?, 'INR', ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1, ?, ?)",
        )
        .bind(
          id,
          owner,
          name,
          area,
          address,
          status,
          builder,
          value,
          homes,
          description,
          completion,
          latitude,
          longitude,
          views,
          requestedAt,
          updatedAt,
        ),
    );
  }

  for (const [
    id,
    title,
    area,
    state,
    category,
    detail,
    source,
    eventDate,
  ] of signals) {
    statements.push(
      db
        .prepare(
          "INSERT OR IGNORE INTO area_signals (id, title, area, state, category, detail, source_note, event_date, created_at, created_by, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'system:demo-seed', 1)",
        )
        .bind(
          id,
          title,
          area,
          state,
          category,
          detail,
          source,
          eventDate,
          updatedAt,
        ),
    );
  }

  await db.batch(statements);
  await syncDemoVerification(db, requestedAt);
}
