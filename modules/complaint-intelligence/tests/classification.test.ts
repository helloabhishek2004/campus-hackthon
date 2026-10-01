import { describe, it, expect } from "vitest";
import { analyzeComplaint } from "../src/index";

describe("Module 2: Heuristic & Mock Analysis Pipeline", () => {
  it("processes electrical hazard complaints with high/critical severity", async () => {
    const request = {
      complaint_id: "CMP-ELE-101",
      text: "There is an electric spark coming from the switchboard in Lab 102 Block A.",
    };

    const res = await analyzeComplaint(request, { provider: "mock" });

    expect(res.success).toBe(true);
    expect(res.analysis).toBeDefined();
    expect(res.analysis?.category).toBe("infrastructure");
    expect(res.analysis?.severity.level).toBe("critical");
    expect(res.analysis?.location.building).toBe("Block A");
    expect(res.analysis?.location.room).toBe("102");
    expect(res.analysis?.suggested_recipient.department).toContain(
      "Maintenance",
    );
  });

  it("processes wifi issue with IT services department routing", async () => {
    const request = {
      complaint_id: "CMP-WIFI-202",
      text: "Hostel Wi-Fi router is continuously disconnecting since morning.",
    };

    const res = await analyzeComplaint(request, { provider: "mock" });

    expect(res.success).toBe(true);
    expect(res.analysis?.category).toBe("it_services");
    expect(res.analysis?.suggested_recipient.department).toContain("IT");
  });
});
