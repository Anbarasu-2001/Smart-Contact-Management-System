const fs = require('fs');

function fixHome() {
    let content = fs.readFileSync('components/pages/Home.tsx', 'utf8');

    // It broke the ternary operator:
    // ${selectedCall?.id === call.id ? transition-all duration-300'ring-1 ring-cyan-300/50' : ''}
    // We want to revert it:
    content = content.replace(/\? transition-all duration-300'/g, "? '");
    
    // Also it broke: hover:-translate-y-1 hover:shadow-xl hover:scale-\[1\.02\]'
    content = content.replace(/\? hover:-translate-y-1 hover:shadow-xl hover:scale-\[1.02\]'/g, "? '");

    // Also:
    content = content.replace(/\? transition-all duration-300`/g, "? `");
    content = content.replace(/\? hover:-translate-y-1 hover:shadow-xl hover:scale-\[1.02\]`/g, "? `");

    // And possibly other generic breaks inside ternary:
    content = content.replace(/\: transition-all duration-300'/g, ": '");
    content = content.replace(/\: hover:-translate-y-1 hover:shadow-xl hover:scale-\[1.02\]'/g, ": '");

    fs.writeFileSync('components/pages/Home.tsx', content);
    console.log('Fixed Home.tsx ternary issues');
}

function fixCard() {
    if (fs.existsSync('components/ui/Card.tsx')) {
        let content = fs.readFileSync('components/ui/Card.tsx', 'utf8');
        content = content.replace(/\? transition-all duration-300'/g, "? '");
        content = content.replace(/\? transition-all duration-300`/g, "? `");
        content = content.replace(/\? hover:-translate-y-1 hover:shadow-xl hover:scale-\[1.02\]'/g, "? '");
        
        fs.writeFileSync('components/ui/Card.tsx', content);
        console.log('Fixed Card.tsx ternary issues');
    }
}

fixHome();
fixCard();