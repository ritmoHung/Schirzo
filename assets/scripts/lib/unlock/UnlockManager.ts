import { GlobalSettings } from "../../settings/GlobalSettings";
import { UnlockRequirement } from "./UnlockRequirement";

interface UnlockTarget {
    id: string;
    type: "song" | "log";
    unlock_requirements: UnlockRequirement.Requirement[];
}

export class UnlockManager {
    private unlockTargets: UnlockTarget[] = []



    // # Functions
    public addUnlockTarget(target: UnlockTarget): void {
        this.unlockTargets.push(target);
    }

    public checkUnlocks(): { songIds: string[], logIds: string[] } {
        const globalSettings = GlobalSettings.getInstance();
        const userData = globalSettings.userData;

        const unlockedSongs: string[] = [];
        const unlockedLogs: string[] = [];

        this.unlockTargets.forEach(target => {
            const items = userData[`${target.type}s`] || [];
            const item = items[target.id];
            const alreadyUnlocked = item && item.unlocked;
            
            if (!alreadyUnlocked) {
                const isUnlocked = UnlockRequirement.allRequirementsMet(target.unlock_requirements, userData);
                if (!isUnlocked) return;

                switch (target.type) {
                    case "song":
                        unlockedSongs.push(target.id);
                        break;
                    case "log":
                        unlockedLogs.push(target.id);
                        break;
                    default:
                        break;
                }
            }
        });

        return {
            songIds: unlockedSongs,
            logIds: unlockedLogs
        }
    }
}