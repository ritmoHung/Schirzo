import { GlobalSettings } from "../../settings/GlobalSettings";
import { UnlockRequirement } from "./UnlockRequirement";

interface UnlockTarget {
    id: string;
    type: "song" | "log";
    unlock_requirements: UnlockRequirement.Requirement[];
}

export class UnlockManager {
    private _unlockTargets: UnlockTarget[] = []



    // # Functions
    get unlockTargets(): UnlockTarget[] {
        return this._unlockTargets;
    }

    public addUnlockTarget(target: UnlockTarget): void {
        this._unlockTargets.push(target);
    }

    public checkUnlocks(): { unlockedSongIds: string[], unlockedLogs: any[] } {
        const globalSettings = GlobalSettings.getInstance();
        const userData = globalSettings.userData;

        const unlockedSongIds: string[] = [];
        const unlockedLogs: any[] = [];

        this._unlockTargets.forEach(target => {
            const item = globalSettings.getUserData(`${target.type}s`, target.id);

            let alreadyUnlocked: boolean;
            switch (target.type) {
                case "song":
                    alreadyUnlocked = item?.unlocked ?? false;
                    if (!alreadyUnlocked) {
                        const isUnlocked = UnlockRequirement.allRequirementsMet(target.unlock_requirements, userData);
                        if (!isUnlocked) return;
                        unlockedSongIds.push(target.id);
                    }
                    break;
                case "log":
                    const unlockLevel = UnlockRequirement.getUnlockLevel(target.unlock_requirements, userData);
                    const currentUnlockLevel = item?.unlock_level ?? 0;
                    alreadyUnlocked = currentUnlockLevel >= unlockLevel;
                    if (!alreadyUnlocked) {
                        unlockedLogs.push({ id: target.id, unlock_level: unlockLevel });
                    }
                    break;
                default:
                    break;
            }
        });

        return {
            unlockedSongIds,
            unlockedLogs
        }
    }
}