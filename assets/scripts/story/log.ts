import { _decorator, Component, Label, ScrollView, find, Node, RichText,Button} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Log')
export class Log extends Component {
    @property(Label)
    text: Label = null;

    @property
    id: number = 0;

    @property(Node)
    scrollViewContent: Node = null; // ScrollView 的 Content 节点

    onLoad() {
        const logBtnEventHandler = new Component.EventHandler();
        logBtnEventHandler.target = this.node;
        logBtnEventHandler.component = 'Log';
        logBtnEventHandler.handler = 'showScrollView';

        const backBtn = find(`Canvas/container/log${this.id}`).getComponent(Button);
        backBtn.clickEvents.push(logBtnEventHandler);
    }

    start() {
        this.setStoryText();
    }

    update(deltaTime: number) {

    }

    showScrollView() {
        const scrollView = find('Canvas/ScrollView').getComponent(ScrollView);
        scrollView.node.active = true;
        scrollView.scrollToTop();
    }

    setStoryText() {
        const storyText = `The sun had just begun to dip below the horizon, casting a golden glow over the quiet village. Birds chirped their final songs of the day, and the gentle breeze rustled through the leaves of the old oak tree in the center of the square. Children laughed and played, their carefree joy echoing through the cobblestone streets.

        At the edge of the village, a small cottage stood, its windows aglow with the warm light of a crackling fire. Inside, an elderly woman sat in a rocking chair, knitting a vibrant blue scarf. Her hands moved with practiced ease, the needles clicking rhythmically as the yarn transformed into a beautiful pattern.

        A young girl, no older than ten, sat at her feet, her eyes wide with wonder as she listened to the tales of adventures and magic her grandmother wove with her words. Stories of brave knights, cunning foxes, and enchanted forests filled the room, transporting the girl to far-off lands where anything was possible.

        As the fire burned low and the night grew darker, the woman set aside her knitting and tucked the girl into bed. She kissed her forehead and whispered a blessing, then sat by the window, watching the stars twinkle in the sky. The village was silent now, the only sound the soft whisper of the wind through the trees.

        The woman smiled, her heart full of love and contentment. She knew that tomorrow would bring another day of stories, another day of magic. And as she drifted off to sleep, she dreamed of the adventures that awaited her and her beloved granddaughter.`;

        const richText = this.scrollViewContent.getComponent(RichText);
        if (richText) {
            richText.string = storyText.replace(/\n\s+/g, "<br />");
        } else {
            const label = this.scrollViewContent.getComponent(Label);
            label.string = storyText;
            label.overflow = Label.Overflow.RESIZE_HEIGHT;
            label.updateRenderData(true);
            this.scrollViewContent.height = label.node.height;
        }
    }
}
