import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

const maxLogNumber = 20;

// Database spec
// {
//     "users": [
//       {
//         "settings": {
//           "flow_speed": 4.0,
//           "offset": 0.0
//         },
//         "chapters": [
//           {
//             "id": 0,
//             "unlocked": true,
//             "songs": [
//               {
//                 "id": 0,
//                 "score": 100000,
//                 "accuracy": 100.00,
//                 "log1_unlocked": true,
//                 "log2_unlocked": true
//               }
//             ],
//             "progress_state": "???"
//           }
//         ]
//       }
//     ],
//     "songs": [],
//     "custom_charts": []
// }

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
    

    protected onLoad(): void {
        
    }
    start() {
        // Initialize Firebase or any other required setups here

    }

    update(deltaTime: number) {

        let userRef = firebase.database().ref('users/' + firebase.auth().currentUser.uid);
        userRef.on('value', (snapshot) => {
            const userData = snapshot.val();
            console.log('User data fetched:', userData);
        });

    }

    async storyAppear(row: number) {
        const userId = firebase.auth().currentUser.uid;
        const userRef = firebase.database().ref('users/' + userId);
        
        try {
            const snapshot = await userRef.once('value');
            const userData = snapshot.val();
            const temp = [];

            if (userData && userData.chapters) {
                userData.chapters.forEach((chapter) => {
                    for (let i = 1; i <= maxLogNumber; i++) {
                        const logName = 'log' + i + '_unlocked';
                        if (chapter[logName]) {
                            temp.push(chapter[logName]);
                        } else {
                            break;
                        }
                    }
                });

                console.log(temp);
                // Additional logic to handle the `temp` array as needed
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }
}
