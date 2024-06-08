import { _decorator, Button, Component, EventKeyboard, Input, input, KeyCode, resources, RichText, Sprite, SpriteFrame, tween, UIOpacity } from "cc";
import { GlobalSettings } from "../settings/GlobalSettings";
import { DatabaseManager } from "../lib/DatabaseManager";
import { SceneTransition } from "../ui/SceneTransition";
import { JudgeManager, JudgementType } from "../lib/JudgeManager";
import { ButtonIconOutline } from "../ui/button/ButtonIcon";
const { ccclass, property } = _decorator;

@ccclass("ResultScreen")
export class ResultScreen extends Component {
    @property(SceneTransition)
    sceneTransition: SceneTransition

    @property(Sprite)
    bgSprite: Sprite

    // RichText
    @property(RichText)
    rankText: RichText
    @property(RichText)
    scoreText: RichText
    @property(RichText)
    diffText: RichText
    @property(RichText)
    pdText: RichText
    @property(RichText)
    pdEarlyText: RichText
    @property(RichText)
    pdLateText: RichText
    @property(RichText)
    dText: RichText
    @property(RichText)
    dEarlyText: RichText
    @property(RichText)
    dLateText: RichText
    @property(RichText)
    goodText: RichText
    @property(RichText)
    goodEarlyText: RichText
    @property(RichText)
    goodLateText: RichText
    @property(RichText)
    cypherText: RichText
    @property(RichText)
    cypherEarlyText: RichText
    @property(RichText)
    cypherLateText: RichText
    @property(RichText)
    accuracyText: RichText

    @property(RichText)
    unlockText: RichText

    // Buttons
    @property(Button)
    backButton: Button | null = null
    @property(Button)
    retryButton: Button | null = null

    private globalSettings: GlobalSettings
    private judgeManager: JudgeManager
    private unlockedSongIds: string[] = []
    private unlockedLogs: any[] = []



    // # Lifecycle
    onLoad() {
        this.globalSettings = GlobalSettings.getInstance();
        this.judgeManager = JudgeManager.getInstance();
        const selectedSong = this.globalSettings.selectedSong;

        // Set background image to song jacket (blurred)
        this.setBackground(selectedSong.id).then(() => {
            // Result & Unlocks
            this.updateUserSongData(selectedSong.id);
            this.checkAndSaveUnlocks();

            // Show result and unlocks
            this.showResult(selectedSong.id);
            this.showUnlockedItems(this.unlockedSongIds, this.unlockedLogs);
            
            // ! And finally attach the event listeners
            // Buttons
            this.backButton.node.on(Button.EventType.CLICK, this.back, this);
            if (!selectedSong.anomaly) {
                this.retryButton.interactable = true;
                this.retryButton.node.on(Button.EventType.CLICK, this.retry, this);
            }

            // Key Down
            input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);

            this.updateLeaderboard(selectedSong.id).then(() => {

            }).catch(error => {
                console.error(error);
            })
        }).catch(error => {
            console.error(error);
        });
    }

    onKeyDown(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.ESCAPE:
                this.globalSettings.audioManager.playSFX(this.backButton.getComponent(ButtonIconOutline).sfx);
                this.back();
                break;
            default:
                break;
        }
    }

    // # Functions
    async setBackground(songId: string) {
        const bgSpriteFrame = await this.getSongJacketBlur(songId);
        this.bgSprite.spriteFrame = bgSpriteFrame;
    }
    
    getSongJacketBlur(songId: string): Promise<SpriteFrame> {
        return new Promise((resolve, reject) => {
            const path = `songs/${songId}/jacket_blur/spriteFrame`;
            resources.load(path, SpriteFrame, (error, spriteFrame) => {
                if (error) {
                    console.error(`RESULT::${songId}::JACKET: Failed to load sprite, reason: ${error.message}`);
                    reject(error);
                    return;
                }

                resolve(spriteFrame);
            });
        });
    }

    showResult(songId: string) {
        const judgements = this.judgeManager.judgements;
        const oldScore = this.globalSettings.getUserData("songs", songId).score ?? 0;
        const scoreDiff = (this.judgeManager.score - oldScore);

        this.rankText.string = this.judgeManager.getRank();
        this.scoreText.string = this.judgeManager.score.toString();
        this.diffText.string = `${scoreDiff >= 0 ? "+" : ""}${scoreDiff.toString()}`;

        this.pdText.string = judgements[JudgementType.PDecrypt].count.toString();
        this.pdEarlyText.string = judgements[JudgementType.PDecrypt].early.toString();
        this.pdLateText.string = judgements[JudgementType.PDecrypt].late.toString();

        this.dText.string = judgements[JudgementType.Decrypt].count.toString();
        this.dEarlyText.string = judgements[JudgementType.Decrypt].early.toString();
        this.dLateText.string = judgements[JudgementType.Decrypt].late.toString();

        this.goodText.string = judgements[JudgementType.Good].count.toString();
        this.goodEarlyText.string = judgements[JudgementType.Good].early.toString();
        this.goodLateText.string = judgements[JudgementType.Good].late.toString();

        this.cypherText.string = judgements[JudgementType.Cypher].count.toString();
        this.cypherEarlyText.string = judgements[JudgementType.Cypher].early.toString();
        this.cypherLateText.string = judgements[JudgementType.Cypher].late.toString();

        this.accuracyText.string = this.judgeManager.accuracy.toString();
        // this.judgeManager.maxCombo
    }

    showUnlockedItems(unlockedSongIds: string[], unlockedLogs: any[]) {
        const songIdsCopy = [...unlockedSongIds];
        const tweenNextSong = () => {
            if (songIdsCopy.length > 0) {
                const songId = songIdsCopy.shift();
                const songName = this.globalSettings.songs.find(song => songId === song.id).name;
                this.unlockText.string = `SONG UNLOCKED: ${songName}`;
                tween(this.unlockText.getComponent(UIOpacity))
                    .to(0.15, { opacity: 255 }, { easing: "smooth" })
                    .delay(4)
                    .to(0.15, { opacity: 0 }, { easing: "smooth" })
                    .call(tweenNextSong)
                    .start();
            } else {
                tweenNextLog();
            }
        }

        const tweenNextLog = () => {
            if (unlockedLogs.length > 0) {
                const log = unlockedLogs.shift();
                this.unlockText.string = `LOG UNLOCKED: ${log.id}, LEVEL ${log.unlock_level}`;
                tween(this.unlockText.getComponent(UIOpacity))
                    .to(0.5, { opacity: 255 }, { easing: "smooth" })
                    .delay(4)
                    .to(0.5, { opacity: 0 }, { easing: "smooth" })
                    .call(tweenNextLog)
                    .start();
            }
        };

        tweenNextSong();
    }

    updateUserSongData(songId: string) {
        if (this.globalSettings.devMode) {
            this.globalSettings.patchUserData({ key: "songs", id: songId, data: {
                score: 900000,
                accuracy: 100.00,
            }});
        } else {
            this.globalSettings.patchUserData({ key: "songs", id: songId, data: {
                score: this.judgeManager.score,
                accuracy: parseFloat(this.judgeManager.accuracy),
            }})
        }
    }

    async updateLeaderboard(songId: string) {
        try {

            let userData = await DatabaseManager.getUserData(this.globalSettings.user.uid);
            console.log('userData:', userData);
            console.log(this.globalSettings.user.email);
    
            
            let maxAccuracy = userData.songs[songId].accuracy;
            let maxScore = userData.songs[songId].score;
            if(this.judgeManager.accuracy > maxAccuracy)
            {
                maxAccuracy = this.judgeManager.accuracy;
            }

            if(this.judgeManager.score > maxScore)
            {
                maxScore = this.judgeManager.score;
            }

            await DatabaseManager.setLeaderBoard(songId, {
                accuracy: maxAccuracy,
                name: this.globalSettings.user.displayName,
                score: maxScore
            });
            console.log('Leaderboard updated successfully');
        } catch (error) {
            console.error('Error updating leaderboard:', error);
        }
    }

    checkAndSaveUnlocks() {
        const { unlockedSongIds, unlockedLogs } = this.globalSettings.unlockManager.checkUnlocks();
        this.unlockedSongIds = unlockedSongIds;
        this.unlockedLogs = unlockedLogs;
        unlockedSongIds.forEach(songId => {
            this.globalSettings.patchUserData({ key: "songs", id: songId, data: { unlocked: true } });
        });
        
        unlockedLogs.forEach(log => {
            this.globalSettings.patchUserData({ key: "logs", id: log.id, data: { unlock_level: log.unlock_level, has_read: false } });
        });

        // Save patched log data to database
        DatabaseManager.updateData();
    }

    retry() {
        this.judgeManager.reset();
        this.loadScene("ChartPlayer");
    }

    back() {
        this.judgeManager.reset();
        this.loadScene("SongSelect");
    }

    loadScene(sceneName: string) {
        this.globalSettings.audioManager.fadeOutBGM(0.5);
        this.sceneTransition.fadeOutAndLoadScene(sceneName);
    }
}
