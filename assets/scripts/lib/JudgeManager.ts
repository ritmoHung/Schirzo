export class JudgeManager {
    private static instance: JudgeManager


    
    // # Constructor
    private constructor() {
        // Private constructor to prevent direct construction calls with the `new` operator.
    }

    public static getInstance(): JudgeManager {
        if (!JudgeManager.instance) {
            JudgeManager.instance = new JudgeManager();
        }
        return JudgeManager.instance;
    }



    // # Functions
}