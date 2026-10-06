-- Repeatable illustrative data seed. Stable IDs preserve user records.
insert into public.builders (id, name, verification_status, locality, city, is_demo_record) values
  ('10000000-0000-4000-8000-000000000001', 'Meridian Habitat', 'rera-verified', 'Bandra East', 'Mumbai', true),
  ('10000000-0000-4000-8000-000000000002', 'Northstar Realty', 'rera-verified', 'Baner', 'Pune', true),
  ('10000000-0000-4000-8000-000000000003', 'Cedarline Developments', 'rera-verified', 'Whitefield', 'Bengaluru', true),
  ('10000000-0000-4000-8000-000000000004', 'Deccan Urbanworks', 'pending', 'Gachibowli', 'Hyderabad', true),
  ('10000000-0000-4000-8000-000000000005', 'Aster Districts', 'pending', 'Wakad', 'Pune', true)
on conflict (id) do nothing;

insert into public.projects (id, name, builder_id, locality, city, site_address, status, est_value, homes, completion_date, description, latitude, longitude, published, view_count, verification_status, is_demo_record) values
  ('20000000-0000-4000-8000-000000000001', 'Meridian One BKC', '10000000-0000-4000-8000-000000000001', 'Bandra East', 'Mumbai', 'Plot C-18, G Block, Bandra Kurla Complex', 'Construction started', 920, 312, 'Q4 2028', 'Illustrative premium mixed-use district with office, retail, and residential phases.', 19.0596, 72.8656, true, 184, 'rera-verified', true),
  ('20000000-0000-4000-8000-000000000002', 'Powai Lake Terraces', '10000000-0000-4000-8000-000000000001', 'Powai', 'Mumbai', 'Saki Vihar Road, Powai', 'Approval stage', 680, 224, 'Q2 2029', 'Illustrative lakeside residential project planned around pedestrian courtyards.', 19.1176, 72.9060, true, 97, 'rera-verified', true),
  ('20000000-0000-4000-8000-000000000003', 'Kothrud Commons', '10000000-0000-4000-8000-000000000002', 'Kothrud', 'Pune', 'Paud Road, Kothrud', 'Redevelopment', 410, 146, 'Q1 2028', 'Illustrative cooperative-housing redevelopment with phased resident handover.', 18.5074, 73.8077, true, 151, 'rera-verified', true),
  ('20000000-0000-4000-8000-000000000004', 'Hinjawadi Square', '10000000-0000-4000-8000-000000000002', 'Hinjawadi', 'Pune', 'Phase 2 Road, Rajiv Gandhi Infotech Park', 'New construction', 560, 410, 'Q3 2029', 'Illustrative transit-oriented residential and neighbourhood retail development.', 18.5913, 73.7389, true, 83, 'rera-verified', true),
  ('20000000-0000-4000-8000-000000000005', 'Whitefield Grove', '10000000-0000-4000-8000-000000000003', 'Whitefield', 'Bengaluru', 'ITPL Main Road, Whitefield', 'Construction started', 740, 520, 'Q4 2028', 'Illustrative family housing campus with shared work and recreation spaces.', 12.9698, 77.7500, true, 226, 'rera-verified', true),
  ('20000000-0000-4000-8000-000000000006', 'Sarjapur Exchange', '10000000-0000-4000-8000-000000000003', 'Sarjapur Road', 'Bengaluru', 'Outer Ring Road junction, Sarjapur', 'Approval stage', 630, 468, 'Q2 2030', 'Illustrative mixed-use community proposed around a new mobility corridor.', 12.8600, 77.7860, true, 74, 'rera-verified', true),
  ('20000000-0000-4000-8000-000000000007', 'Gachibowli Central', '10000000-0000-4000-8000-000000000004', 'Gachibowli', 'Hyderabad', 'Financial District Road, Gachibowli', 'New construction', 810, 390, 'Q1 2030', 'Illustrative high-density residential project near the financial district.', 17.4401, 78.3489, true, 119, 'pending', true),
  ('20000000-0000-4000-8000-000000000008', 'Kokapet Vista', '10000000-0000-4000-8000-000000000004', 'Kokapet', 'Hyderabad', 'Neopolis Road, Kokapet', 'Construction started', 950, 610, 'Q3 2029', 'Illustrative multi-tower development with active construction milestones.', 17.3948, 78.3375, true, 207, 'pending', true),
  ('20000000-0000-4000-8000-000000000009', 'Wakad Yards', '10000000-0000-4000-8000-000000000005', 'Wakad', 'Pune', 'Datta Mandir Road, Wakad', 'Redevelopment', 360, 180, 'Q4 2027', 'Illustrative neighbourhood renewal project with upgraded community facilities.', 18.5980, 73.7620, true, 138, 'pending', true),
  ('20000000-0000-4000-8000-000000000010', 'Thanisandra Park', '10000000-0000-4000-8000-000000000005', 'Thanisandra', 'Bengaluru', 'Thanisandra Main Road', 'New construction', 495, 330, 'Q2 2029', 'Illustrative mid-rise housing development connected to emerging social infrastructure.', 13.0550, 77.6330, true, 92, 'pending', true)
on conflict (id) do nothing;

insert into public.area_signals (id, title, description, status_tag, locality, city, state, source_label, event_date, is_demo_record) values
  ('30000000-0000-4000-8000-000000000001', 'Construction activity expands near BKC', 'Two major phases in the demo workspace now show active construction milestones.', 'Construction started', 'Bandra East', 'Mumbai', 'Maharashtra', 'Illustrative demo activity feed', '2026-09-12', true),
  ('30000000-0000-4000-8000-000000000002', 'Redevelopment cluster forming in Kothrud', 'The demo dataset shows multiple renewal opportunities around established residential corridors.', 'Redevelopment', 'Kothrud', 'Pune', 'Maharashtra', 'Illustrative demo activity feed', '2026-09-08', true),
  ('30000000-0000-4000-8000-000000000003', 'Whitefield delivery pipeline advances', 'Recorded demo milestones indicate growing residential supply near employment hubs.', 'Construction started', 'Whitefield', 'Bengaluru', 'Karnataka', 'Illustrative demo activity feed', '2026-09-03', true),
  ('30000000-0000-4000-8000-000000000004', 'Kokapet pipeline gains momentum', 'The demo workspace highlights a growing mix of planned and active high-density projects.', 'New construction', 'Kokapet', 'Hyderabad', 'Telangana', 'Illustrative demo activity feed', '2026-08-29', true)
on conflict (id) do nothing;

insert into public.localities (name, city, state, latitude, longitude, is_demo_record)
select p.locality, p.city,
  case p.city when 'Mumbai' then 'Maharashtra' when 'Pune' then 'Maharashtra'
    when 'Bengaluru' then 'Karnataka' when 'Hyderabad' then 'Telangana' end,
  p.latitude, p.longitude, true
from public.projects p
where p.is_demo_record and p.latitude is not null and p.longitude is not null
on conflict (name, city) do nothing;
