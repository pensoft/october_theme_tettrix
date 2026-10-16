<?php
/**
 * Default Pensoft.Jumbotron entries for Taxonomy Recognition Day
 * (pages/name-it-to-save-it.htm and the banner on pages/home.htm).
 *
 * Both pages call trdEnsureEntries(), which creates any entry from this list
 * that is missing from pensoft_jumbotron. Existing entries are never touched,
 * so edits made in the backend stick. Same rows as seed-jumbotron-trd.sql in
 * the project root (the manual route); see its header for what each field is
 * used for. Keep the two in step.
 *
 * Returns slug => fields.
 */
return [
    'trd-eyebrow' => [
        'title' => 'Taxonomy Recognition Day · May 23rd',
        'body' => '',
    ],
    'trd-hero' => [
        'title' => 'Join the #NameItToSaveIt Movement',
        'body' => '<p>Every species has a story—but without a name, that story may never be told. The TETTRIs project is a coalition of Europe’s leading natural history museums and botanical gardens.</p>',
    ],
    'trd-participate' => [
        'title' => 'How you can participate',
        'body' => '',
    ],
    'trd-step-01' => [
        'title' => 'TRD - Step 01',
        'body' => '<p>Take a photo of a plant, animal, fungus, or microbe that fascinates you.</p>',
    ],
    'trd-step-02' => [
        'title' => 'TRD - Step 02',
        'body' => '<p>Find its scientific name or ask for help — we’re here for that.</p>',
    ],
    'trd-step-03' => [
        'title' => 'TRD - Step 03',
        'body' => '<p>Share it on social media with the hashtag #NameItToSaveIt</p>',
    ],
    'trd-celebration' => [
        'title' => 'From Europe and around the world celebration',
        'body' => '<p>On May 23rd, 2025 Taxonomy Recognition Day reach hundreds of thousands of people. From the Canary Islands to Norway, and Portugal to Greece came together to shine a spotlight on taxonomy as the foundation of biodiversity research and conservation. Events included expert talks, debates, behind-the-scenes tours, hands-on activities, and networking opportunities, all aimed at raising awareness about the critical role of taxonomy in our world.</p>',
    ],
    'trd-stat-01' => [
        'title' => 'TRD - Stat people',
        'body' => '<p>Reaching over <strong>700,000</strong> people</p>',
    ],
    'trd-stat-02' => [
        'title' => 'TRD - Stat institutions',
        'body' => '<p>Over <strong>30</strong> Institutions</p>',
    ],
    'trd-why' => [
        'title' => 'Why it matters',
        'body' => '<p>A million species are currently threatened with extinction—<em>many of them still unknown to science.</em></p><p>Naming a species is the first step toward protecting it. Taxonomy plays a crucial role in agriculture, medicine, conservation, and policy-making. Without it, we cannot fully understand, protect, or restore the biodiversity that sustains us all.</p>',
        'button_name' => 'Watch video',
        'url' => '/themes/pensoft-tettrix/assets/videos/trd-name-it-to-save-it.mp4',
    ],
    'home-trd-banner' => [
        'title' => 'Join the #NameItToSaveIt Movement',
        'body' => '<p>Every species has a story—but without a name, that story may never be told. Snap a photo, find its scientific name and share it with #NameItToSaveIt.</p>',
        'button_name' => 'Find out how to take part',
        'url' => '/NameItToSaveIt',
    ],
];
