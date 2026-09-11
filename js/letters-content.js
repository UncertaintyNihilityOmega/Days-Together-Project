/*
  letters-content.js — just the words.

  This file holds nothing but the "why I love you" reasons and the full
  love letters for each person — no HTML structure, no styling, no
  behavior. script.js reads this data and builds the reasons list and
  the letter peek from it. Edit THIS file to change what the page says;
  you never need to touch index.html, css/style.css, or script.js just
  to update your own words.

  Each person has:
    reasons          — a list of short strings, one per bullet
    letterTitle       — shown as the letter's heading when it's opened
    letterParagraphs  — a list of strings, one per paragraph
*/
(function(){
  'use strict';

  window.LettersContent = {

    // ↓↓↓ EDIT THIS — Tessa's reasons and letter, for Uncertainty ↓↓↓
    tessa: {
      reasons: [
        "He tries to be better for me~ 🌸",
        "He's very emotional and cute ✨",
        "He wants to stay with me and help me 🌟",
        "He tries his best for me and he's already changed a lot 🌺",
        "He's my safe place and I can tell him everything 🌌",
        "He listens to my worries ❤️‍🩹",
        "I don't feel judged with him 🏩",
        "He has a flexible and adaptable mind 🧠 and he doesn't fear to change-",
        "He wants to make me smile and make me feel loved 💞",
        "He doesn't worry about other opinions on him expect mine 🌹 (he doesn't worry do be cringe)",
        "He's funny in a baka way and he's spontaneous 😜",
        "I can be myself with him 🤗"
      ],
      letterTitle: "To My Beloved Uncertainty",
      letterParagraphs: [
        "Dear Uncertainty, My Love, I wanted to create this letter to surprise you again. Since the day that I met you, I understood that you were different from others and my heart instantly fell in love with you and couldn't stop showing you my love until you finally noticed it.",
        "Well I don't think I am able to explain all the reasons why I loved you and keep loving you every day, but I know that I choose to stay with you every day of my life. Every day I choose you with all my heart and I will choose you every single day of my life until death, which I hope you will somehow \"solve\" with your genius mind, so we will be able to stay together for the rest of our lives.",
        "I love to share everything with you and I love that you share everything with me too. You are the first and only person I've ever dreamt a future with, all my life with. A future with you is the only future I want for my life. You are very special for me.",
        "I love when we listen to each other's feelings, when you make me smile, when you smile (your smile makes my heart melt), when you laugh with me, when you tell me that I'm intelligent and beautiful, when you write those long messages to show me how much you love me, when we take care of each other and support each other in everything, when we don't judge each other and we comfort each other, when we do that special thing lovely dovely together and we share those special and sweet moments that belong only to us, when we do activities together like drawing, watching films, and playing, when you keep trying to be a better person for me and I do the same trying to find an agreement and understand each other, when we remember small things, when we share our interests with each other, and I could keep going on for so long... I love that we can be ourselves with each other, yes I love it so much.",
        "I hope you see how much I do for you because I see how much you do. During these months together, I saw you became a completely different person, so determined to study for our future, so responsible, so far from distractions and so mature~ I hope all this is also thanks to me, that I gave you the motivation to build a future together because I saw your will has really changed, especially this summer.",
        "I cannot express how much I am proud of you, because you are not doing all this only for us but also for yourself. I really love you, all yourself, your everything with all my heart.",
        "You helped me so many times, listened to all my worries when I was sad, as I always do to you and I will always keep doing, and protected me from myself in a period while I felt so lonely and broken, and I know you won't stop doing that. You are the best person in my life, or, as you say, the \"bestest\" person in my life. Our support is the best thing that could ever happen in my life~ I cannot imagine a life without you~",
        "I love you so much that words are not enough to express how much, truly and deeply my heart always beats for you and my mind is imagining you with me all the time... I hope our first meetings will happen soon~ I am grateful for our relationship, because our meeting wasn't a given, and I think we are so lucky that it happened.",
        "From the deepest and more sincere part of my heart, forever yours, Tessa <3"
      ]
    },
    // ↑↑↑ EDIT THIS ↑↑↑

    // ↓↓↓ EDIT THIS — Uncertainty's reasons and letter, for Tessa ↓↓↓
    uncertainty: {
      reasons: [
        "We are supporting each other every day more for our shared, bright, lovely dovely future 💞",
        "She's very determined, caring, strong minded, romantic, and is the cutest person the earth behind her protection barriers 💖",
        "We are improving together, as we continue to walk in this endless universe, as our personalities improving, as the beautiful, productive, and energetic things we build together, as the world we change around us, as we learn and evolve for an eternity of LOVE & CREATIVITY 💝",
        "Another endless beautiful thing about her, is that I can be myself with her and she loves me no matter how different I can be~, I love that we share different aspects and skills so we can support each other where we don't understand and exchange beautiful perspectives 💗",
        "Every day with her is so lovely dovely, happy, and calm. I truly want to live my all life with her. I cannot imagine a life without her.. she is my sunshine, my starry night, my hope, my dream, my motivation, my strength, my beloved she is an amazing person and an even more amazing partner ❤️‍🔥"
      ],
      letterTitle: "To My Beloved Tessa-Chan",
      letterParagraphs: [
        "My Dear Tessa-Chan~, My Beloved Heart~, 🌸🥰🌸",
        "Here is my lovely dovely heart filled letter for u~ 🌹😘💝, and to build our bright, passionate, heart melting future, all thanks to you. Since the day I met you in Bloxd.io, building quietly while you fought your way through the world with so much fire in you, I knew there was something different about you. I was the calm builder, you were the determined fighter, and somehow those two different sounds found each other, tied together and never let go. I fell in love with your passion, and you fell in love with my peace, and ever since then I have chosen you, every single day, with all my heart. ❤️‍🔥💞❤️‍🔥🌸",
        "I don't think I could ever fully explain every reason why I love you, Tessa-chan, but I know that no matter the distance between Turkey and Italy, no matter how many kilometers sit between us, I choose you, again and again, until the day we finally close that distance for good. I love that even from so far away, we share everything with each other~ our days, our worries, our small but endless improvements, my code & ur music, the beautiful memories we make along the way, our dreams & hopes for our passionate future. You are the first and only person I have ever imagined my whole future with. A future with you, studying together in Italy one day, building a real life side by side instead of through a screen, is the only future I want. 💖🥰💖",
        "You are so special to me, Tessa. I love listening to you talk about your Italian Literature, your Mythology, your Philosophy and History, hearing how your mind lights up with every new idea. I love that you play the harp and sometimes the piano, and that when you talk about music I can hear how much of your heart lives inside it. And I hope you see how much I love sharing my world with you too~ my coding, my science, my biology~ because you never once made me feel like those things were less beautiful than yours. 💗🥰💗",
        "I love the way we love each other through the things we make. I still feel the passion inside me every time I look at our lovely lamp, the one with two hearts tied together by an arrow inside a little crystal circle, spinning slowly under its light~ I chose it because that's exactly what I feel we are. I still look at the photos of that beautiful paper creation you made me, side after side, each one hiding another drawing, another sweet word from you, and I don't think you know how much I desire it in my hands. Our Notion page full of our memories, the audio visualizer I coded just so you'd have a place to play the songs you made in a beautiful way forged with my heart that remind you of us~ all of it is my way of saying \"I love you\" in the only languages I know how to speak: care, passion, and creation. 💞🥰💞💌",
        "I hope you see how much I do for you, my love, because I see everything you do for me. In these months together, I've watched you become stronger~ I remember how hard things used to be for you, how hard it was some days just to keep going, and now I see someone so much more determined, so much more sure of herself. I would love to believe our love had something to do with that. And you did the same for me~ before you, I was so lost, so unmotivated about my future, so easily pulled away by distractions. You gave me something to build toward, and I have never wanted anything more than I want the life we're planning together. We became each other's hope, Tessa. I don't think either of us will ever be able to put a price on that. 💘❤️‍🔥💘💌",
        "You've listened to every worry I've ever had, held me up on the days I felt like I was falling apart, and I have tried, and will always try, to do the same for you. You are the best person in my life. I cannot imagine my life without you in it, even from across a screen, even across a sea. I love you so much that words are never quite enough, but I hope this lovely passionate letter says at least a little of what my heart means to tell you every single day. I hope the day we finally meet, in person, for the first time, comes soon~ I dream about it more than I could ever explain. 💕🥰💕❤️‍🔥",
        "I am so grateful for a meeting that started in a silly little game and turned into the realest, deepest thing I have ever known. Some things really are worth crossing a country, or a sea, for. ❤️‍🔥💕💘",
        "From the deepest and most sincere part of my heart, forever yours, Uncertainty 💝"
      ]
    }
    // ↑↑↑ EDIT THIS ↑↑↑

  };
})();
