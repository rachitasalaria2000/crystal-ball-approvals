// Authored assessment policy: five retrievable chunks, 287 words in total.
export const policy = [
  {
    id: "P1",
    title: "Review responsibility",
    text: "Only an assigned reviewer may approve or reject a pending item. Open the item and confirm its title, submitted version, owner, and intended site before deciding. The assistant offers advice only and cannot execute approvals. If your role is unclear, ask the site administrator to confirm your authority. Never share account credentials to complete a review.",
  },
  {
    id: "P2",
    title: "Safety equipment and sensors",
    text: "For safety equipment and sensor specifications, verify the maintenance date, calibration record, and compatibility with the site equipment register. Missing calibration evidence is a reason to request changes rather than approve. Escalate a suspected immediate safety hazard to the site safety lead. A document title alone does not establish that a hazard exists or that maintenance is overdue.",
  },
  {
    id: "P3",
    title: "Patrol and drone evidence",
    text: "For patrol onboarding checklists, confirm that emergency contacts, escalation steps, and technician check-in instructions are present. For drone patrol videos, verify the location, capture date, operator authorization, and visibility of the required patrol area. Ask the submitter for missing evidence. Do not infer regulatory clearance, flight permissions, or a safe operating condition from a demonstration video.",
  },
  {
    id: "P4",
    title: "Spatial maps and privacy",
    text: "For spatial layouts and camera maps, compare zone names and camera positions against the current site plan. Check that sensitive areas have appropriate access restrictions. A stale or incomplete map should be returned with a specific correction request. Restrict screenshots and recordings to authorized reviewers; never publish security layouts or personal information outside the approved workspace.",
  },
  {
    id: "P5",
    title: "Decision and audit trail",
    text: "Record a concise decision reason and the evidence reviewed. Approve only when required checks are complete; otherwise request changes or reject with an actionable explanation. All four sample items have the same submission date and no supplied severity. Prioritize confirmed safety impact first, then operational dependency, then age when known. When impact is unknown, explain the uncertainty and seek clarification instead of inventing a deadline.",
  },
];
