import { _decorator, Component, Toggle } from 'cc';
import { Toggles } from './input/Toggles';
const { ccclass, property } = _decorator;

@ccclass('EventProperties')
export class EventProperties extends Component {
    @property(Toggles)
    eventFilterToggle: Toggles = null;
}


