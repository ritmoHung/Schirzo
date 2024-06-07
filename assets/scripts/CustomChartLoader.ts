import { _decorator, Button, Component, director, EditBox, instantiate, Label, Node, Prefab, tween, UIOpacity } from 'cc';
import { FirebaseManager } from './lib/FirebaseManager';
import { CustomSong } from './menu/CustomSong';
import { NumericInput } from './editor/input/NumericInput';
import { PublishDialog } from './menu/PublishDialog';
import { CustomSongData } from './settings/song';
const { ccclass, property } = _decorator;

@ccclass('CustomChart')
export class CustomChart extends Component {
    @property(Node)
    songSelectionPool: Node = null;
    @property(Prefab)
    songSelectionPrefab: Prefab = null;

    @property(NumericInput)
    pageInput: NumericInput = null;
    @property(EditBox)
    searchEditbox: EditBox = null;
    
    @property(Button)
    backButton: Button = null;
    @property(Button)
    editButton: Button = null;

    @property(Button)
    publishButton: Button = null;
    @property(PublishDialog)
    publishDialog: PublishDialog = null;

    @property(Label)
    noCustomSongLabel: Label = null;

    songs: CustomSongData[] = [];
    searchedSongs: CustomSongData[] = [];
    songBlocks: CustomSong[] = [];

    @property(UIOpacity)
    filter: UIOpacity = null;

    private readonly maxSongPerPage = 7;

    onLoad() {
        this.filter.opacity = 255;
        tween(this.filter).to(0.25, {opacity: 0}).start();
        this.pageInput.interactable = false;
        this.pageInput.values = ["-"];
        this.noCustomSongLabel.string = "loading...";
        this.backButton.node.on("click", this.back, this);
        this.editButton.node.on("click", this.edit, this);
        this.publishButton.node.on("click", this.publish, this);
        this.publishDialog.node.active = false;
        this.pageInput.node.on("change", this.pageUpdate, this);
        this.searchEditbox.node.on("text-changed", this.songSearch, this);
        for (let i = 0; i < this.maxSongPerPage; i++) {
            const node = instantiate(this.songSelectionPrefab);
            this.songBlocks.push(node.getComponent(CustomSong));
            this.songBlocks[i].interactable = false;
            this.songSelectionPool.addChild(node);
        }
    }

    /*
    onDestroy() {
        this.backButton.node.off("click", this.back, this);
        this.editButton.node.off("click", this.edit, this);
        this.publishButton.node.off("click", this.publish, this);
        this.pageInput.node.off("change", this.pageUpdate, this);
        this.searchEditbox.node.off("text-changed", this.songSearch, this);
    }*/

    start() {
        FirebaseManager.loadCustomSongs((songs) => {
            this.songs = songs;
            this.searchedSongs = songs;
            this.noCustomSongLabel.string = "no chart data.";
            this.noCustomSongLabel.node.active = songs.length == 0;
            this.pageInput.interactable = true;
            this.pageInput.values = [];
            for (let i = 1; i <= Math.ceil(songs.length / this.maxSongPerPage); i++) {
                this.pageInput.values.push(`${i}`);
            }
            this.pageInput.selectionChange(0);
            this.pageUpdate();
        });
    }

    pageUpdate() {
        for (let i = 0; i < this.maxSongPerPage; i++) {
            const idx = this.pageInput.index * this.maxSongPerPage + i;
            if (idx >= this.searchedSongs.length) {
                this.songBlocks[i].interactable = false;
            } else {
                this.songBlocks[i].interactable = true;
                this.songBlocks[i].initialize(this.searchedSongs[idx]);
            }
        }
    }

    songSearch() {
        this.searchedSongs = this.songs.filter((song) => song.name.includes(this.searchEditbox.string) || song.artist?.includes(this.searchEditbox.string));
        if (this.searchedSongs.length == 0) {
            this.pageInput.interactable = false;
            this.pageInput.values = ["-"];
        } else {
            this.pageInput.interactable = true;
            this.pageInput.values = [];
            for (let i = 1; i <= Math.ceil(this.searchedSongs.length / this.maxSongPerPage); i++) {
                this.pageInput.values.push(`${i}`);
            }
        }
        this.pageInput.selectionChange(0);
        this.pageUpdate();
    }

    back() {
        director.loadScene("ChapterSelect");
    }

    edit() {
        this.filter.opacity = 0;
        tween(this.filter).to(0.25, {opacity: 255}).start();
        director.loadScene("ChartEditor");
    }
    
    publish() {
        this.publishDialog.node.active = true;
        this.publishDialog.enabled = false;
        this.publishDialog.opacity.opacity = 0;
        tween(this.publishDialog.opacity).to(0.15, {opacity: 255}).call(() => this.publishDialog.enabled = true).start();
    }
}


