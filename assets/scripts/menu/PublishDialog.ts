import { _decorator, Button, Component, EditBox, Node, tween, UIOpacity } from 'cc';
import { ImportButton } from './ImportButton';
import { FirebaseManager } from '../lib/FirebaseManager';
const { ccclass, property } = _decorator;

@ccclass('PublishDialog')
export class PublishDialog extends Component {
    @property(UIOpacity)
    opacity: UIOpacity = null;

    @property(Button)
    publishButton: Button = null;
    @property(Button)
    closeButton: Button = null;

    @property(EditBox)
    nameEditbox: EditBox = null;
    @property(ImportButton)
    chartFile: ImportButton = null;
    @property(ImportButton)
    audioFile: ImportButton = null;

    onLoad() {
        this.publishButton.node.on("click", this.publish, this);
        this.closeButton.node.on("click", this.close, this);
        this.nameEditbox.node.on("text-changed", this.updatePublishButton, this);
        this.chartFile.node.on("file-change", this.updatePublishButton, this);
        this.audioFile.node.on("file-change", this.updatePublishButton, this);
        this.updatePublishButton();
    }

    publish() {
        FirebaseManager.publishCustomSong({id: this.nameEditbox.string.toLowerCase().replace(" ", "").concat(), name: this.nameEditbox.string, artist: "test"}, this.chartFile.file, this.audioFile.file, (err) => {
            this.close();
        });
    }

    close() {
        this.enabled = false;
        this.nameEditbox.string = "";
        this.chartFile.file = null;
        this.audioFile.file = null;
        tween(this.opacity).to(0.15, {opacity: 0}).call(() => this.node.active = false).start();
    }

    updatePublishButton() {
        console.log("test");
        this.publishButton.interactable = this.chartFile.file && this.audioFile.file && this.nameEditbox.string.length > 0;
    }
}


