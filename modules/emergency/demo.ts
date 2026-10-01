import { rulePriority, finalPriority, Priority } from './lib/emergency/priority';
import { extractLocations } from './lib/emergency/locations';
import { approvalsOk } from './lib/emergency/approvals';

async function runDemo() {
    console.log("=========================================");
    console.log(" SMART CAMPUS EMERGENCY - RUNNING SYSTEM ");
    console.log("=========================================\n");

    // Simulated incoming report
    const report1 = {
        id: "ER-2026-0001",
        reporter: "Student A",
        type: "security_threat",
        text: "I saw a suspicious man with a knife near the library entrance!",
        reportedLocationId: 105 // Let's say they picked an arbitrary location
    };
    
    console.log(`[1] New incoming report received: ${report1.id}`);
    console.log(`    Type: ${report1.type}`);
    console.log(`    Text: "${report1.text}"`);

    // Step 1: Rule-based priority
    console.log("\n[2] Executing fail-safe Rule-Based Triage...");
    const basePrio = rulePriority({ type: report1.type, text: report1.text });
    console.log(`    -> Evaluated Rule Priority: P${basePrio}`);

    // Step 2: Location extraction (ML/Fuzzy Assist)
    console.log("\n[3] Extracting locations from text (Fuzzy Assist)...");
    const extracted = extractLocations(report1.text);
    console.log(`    -> Found potential locations:`, extracted.length > 0 ? extracted : "None");
    if (extracted.length > 0 && extracted[0].locationId !== report1.reportedLocationId) {
        console.log(`    -> [WARN] Reporter selected location ID ${report1.reportedLocationId}, but text mentions ID ${extracted[0].locationId} (Library). Flagging for human review.`);
    }

    // Step 3: Simulating incident clustering
    console.log("\n[4] Simulating clustering for corroboration...");
    // Pretend 3 distinct people reported this within 10 minutes
    const distinct_reporters = 3;
    let corroborationPrio: Priority | null = null;
    if (distinct_reporters >= 3) {
        corroborationPrio = 1; // escalated due to mass reports
        console.log(`    -> Corroboration triggered: ${distinct_reporters} distinct reporters. Corroboration priority = P1.`);
    }

    // Final priority calculation
    const finalP = finalPriority(basePrio, null, corroborationPrio);
    console.log(`\n[5] Calculating Final Priority = MIN(rule, ml, corroboration)`);
    console.log(`    -> Final Priority set to: P${finalP} (Alarm triggered for Security Console!)`);

    // Step 4: Alert Generation & Approval
    console.log("\n[6] Security team preparing Campus-Wide Alert...");
    const approvers = [
        { id: 991, role: "responder" },
    ];
    
    console.log("    -> Attempting approval with 1 responder...");
    let isApproved = approvalsOk("campus_wide", approvers);
    console.log(`    -> Approved? ${isApproved ? 'YES' : 'NO'}`);

    console.log("    -> Adding Security Head to approvers...");
    approvers.push({ id: 992, role: "security_head" });
    isApproved = approvalsOk("campus_wide", approvers);
    console.log(`    -> Approved? ${isApproved ? 'YES' : 'NO'}`);

    if (isApproved) {
        console.log("\n[7] ALERT SENT: 'SECURITY ALERT: Stay where you are. Lock doors... Avoid Library.'");
    }

    console.log("\n=========================================");
    console.log(" DEMO FINISHED ");
    console.log("=========================================\n");
}

runDemo();
