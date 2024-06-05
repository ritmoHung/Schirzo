export namespace UnlockRequirement {
    export interface Requirement {
        type: string;
        [key: string]: any;
    }

    export function isRequirementMet(requirement: Requirement, data: any): boolean {
        let chapters: any, songs: any;
        let chapter: any, song: any;

        switch (requirement.type) {
            case "song_score":
                songs = data.songs || [];
                song = songs[requirement.song_id];
                return song && song.score >= requirement.required_score;
            case "song_accuracy":
                songs = data.songs || [];
                song = songs[requirement.song_id];
                return song && song.accuracy >= requirement.required_accuracy;
            case "chapter_state":
                chapters = data.chapters || [];
                chapter = chapters[requirement.chapter_id];
                return chapter && chapter.progress_state >= requirement.required_state;
            default:
                return false;
        }
    }

    export function allRequirementsMet(requirements: Requirement[], data: any): boolean {
        return requirements.every(requirement => isRequirementMet(requirement, data))
    }

    export function getUnlockLevel(requirements: Requirement[], data: any): number {
        let unlockLevel = 0;

        requirements.forEach(requirement => {
            if (isRequirementMet(requirement, data)) {
                unlockLevel = Math.max(unlockLevel, requirement.unlock_level);
            }
        });

        return unlockLevel;
    }
}