import { _decorator, Component, Node, SpriteFrame, Sprite, Button, director, find } from 'cc';
import Queue from './queue';

const { ccclass, property } = _decorator;
const { EventHandler } = cc;

const maxLogNumber = 14;

interface Edge {
    from: number;
    to: number;
}

@ccclass('Story')
export class Story extends Component {
    @property(Node)
    log1: Node = null;

    @property(Node)
    log2: Node = null;

    @property(Node)
    log3: Node = null;

    @property(Node)
    log4: Node = null;

    @property(Node)
    log5: Node = null;

    @property(Node)
    log6: Node = null;

    @property(Node)
    log7: Node = null;

    @property(Node)
    log8: Node = null;

    @property(Node)
    log9: Node = null;

    @property(Node)
    log10: Node = null;

    @property(Node)
    log11: Node = null;

    @property(Node)
    log12: Node = null;

    @property(Node)
    log13: Node = null;

    @property(Node)
    log14: Node = null;

    @property(SpriteFrame)
    unlockedSprite: SpriteFrame = null;

    private edgeList: Edge[] = [];
    private adjacencyList: Map<number, number[]> = new Map();
    private inDegree: Map<number, number> = new Map();
    private prerequisites: number[] = [];

    onLoad(): void {
        // Initialize the graph
        this.initializeGraph();
    }

    start(): void {
        this.edgeList.forEach(edge => {
            this.inDegree.set(edge.to, (this.inDegree.get(edge.to) || 0) + 1);
        });
        this.prerequisites = this.topologySort();

        // Create and add EventHandler for back button
        const backBtnEventHandler = new Component.EventHandler();
        backBtnEventHandler.target = this.node;
        backBtnEventHandler.component = 'Story';
        backBtnEventHandler.handler = 'loadScene';

        const backBtn = find('Canvas/back_btn').getComponent(Button);
        backBtn.clickEvents.push(backBtnEventHandler);
    }
    
    update(deltaTime: number): void {
        this.fetchUnlockedLogs().then(unlockedNodes => {
            if (unlockedNodes) {
                for (let node of this.prerequisites) {
                    if (this.canVisitNode(node, unlockedNodes)) {
                        const logNode = this.getLogNode(node);
                        if (logNode) {
                            logNode.active = true;
                            // Optionally unlock node sprite here
                            // this.unlock(node);
                        }
                    }
                }
            }
        }).catch(error => {
            console.error('Error in update:', error);
        });
    }

    unlock(index: number): void {
        const logNode = this[`log${index}`];
        if (logNode) {
            const sprite = logNode.getComponent(Sprite);
            if (sprite) {
                sprite.spriteFrame = this.unlockedSprite;
            }
        }
    }

    async fetchUnlockedLogs(): Promise<number[]> {
        const userId = firebase.auth().currentUser.uid;
        const userRef = firebase.database().ref('users/' + userId);

        try {
            const snapshot = await userRef.once('value');
            const userData = snapshot.val();
            const unlockedLogs: number[] = [];

            if (userData && userData.chapters) {
                userData.chapters.forEach(chapter => {
                    for (let i = 1; i <= maxLogNumber; i++) {
                        const logName = `log${i}_unlocked`;
                        for (let song of chapter.songs) {
                            if (song[logName]) {
                                unlockedLogs.push(i);
                                break;
                            }
                        }
                    }
                });
            }

            return unlockedLogs;
        } catch (error) {
            console.error('Error fetching user data:', error);
            return [];
        }
    }

    addEdge(from: number, to: number): void {
        this.edgeList.push({ from, to });

        if (!this.adjacencyList.has(from)) {
            this.adjacencyList.set(from, []);
        }
        this.adjacencyList.get(from)?.push(to);

        if (!this.inDegree.has(to)) {
            this.inDegree.set(to, 0);
        }
        this.inDegree.set(to, this.inDegree.get(to)! + 1);
    }

    getNeighbors(node: number): number[] | undefined {
        return this.adjacencyList.get(node);
    }

    printGraph(): void {
        console.log('Edge List:', this.edgeList);
        console.log('Adjacency List:', this.adjacencyList);
        this.adjacencyList.forEach((neighbors, node) => {
            neighbors.forEach(neighbor => {
                console.log("graph:", node, '->', neighbor);
            });
        });
    }

    topologySort(): number[] {
        const q = new Queue<number>();
        const sortedList: number[] = [];

        this.inDegree.forEach((inDegree, node) => {
            if (inDegree === 0) {
                q.push(node);
            }
        });

        while (!q.empty()) {
            const node = q.front();
            q.pop();
            sortedList.push(node);

            const neighbors = this.getNeighbors(node);
            if (neighbors) {
                neighbors.forEach(neighbor => {
                    this.inDegree.set(neighbor, this.inDegree.get(neighbor)! - 1);
                    if (this.inDegree.get(neighbor) === 0) {
                        q.push(neighbor);
                    }
                });
            }
        }

        if (sortedList.length !== this.adjacencyList.size) {
            throw new Error('Graph has at least one cycle');
        }

        return sortedList;
    }

    canVisitNode(node: number, unlockedNodes: number[]): boolean {
        const predecessors = this.edgeList.filter(edge => edge.to === node).map(edge => edge.from);
        for (let pred of predecessors) {
            if (unlockedNodes.indexOf(pred) === -1) {
                return false;
            }
        }
        return true;
    }

    private initializeGraph(): void {
        // Add the edges here if necessary
        // Example: this.addEdge(1, 2);
    }

    loadScene(): void {
        //暫定intro
        director.loadScene('intro');
    }

    private getLogNode(index: number): Node | null {
        return this[`log${index}`] || null;
    }
}
