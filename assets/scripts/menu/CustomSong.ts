import { _decorator, Button, Component, director, Label, Node } from 'cc';
import { CustomSongData } from '../lib/FirebaseManager';
import { GlobalSettings } from '../settings/GlobalSettings';
const { ccclass, property } = _decorator;

@ccclass('CustomSong')
export class CustomSong extends Component {
    @property(Label)
    nameLabel: Label = null;
    @property(Label)
    artistLabel: Label = null;

    private id: string;
    private button: Button = null;

    public set interactable(value: boolean) {
        if (value != this.node.active) {
            if (!this.button) {
                this.button = this.getComponent(Button);
            }
            this.button.interactable = value;
            this.node.active = value;
        }
    }

    onLoad() {
        this.node.on("click", this.playChart, this);
    }

    initialize(customSongData: CustomSongData) {
        this.id = customSongData.id;
        this.nameLabel.string = customSongData.name;
        this.artistLabel.string = "by  " + customSongData.artist;
    }

    playChart() {
        GlobalSettings.getInstance().selectedSong = {
            type: "custom",
            id: this.id
        };
        director.loadScene("ChartPlayer");
    }
}


