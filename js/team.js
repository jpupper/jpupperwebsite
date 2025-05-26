// === TEAM SECTION JS ===
class TeamMember {
    constructor({ name, image, roleKey, bioKey }) {
        this.name = name;
        this.image = image;
        this.roleKey = roleKey;
        this.bioKey = bioKey;
    }
}

const teamMembers = [
    new TeamMember({
        name: "Julian Puppo",
        image: "img/team/julian.png",
        roleKey: 0,
        bioKey: 0
    }),
    new TeamMember({
        name: "Caterina Ditrano",
        image: "img/team/caterina.png",
        roleKey: 1,
        bioKey: 1
    }),
    new TeamMember({
        name: "Tolch",
        image: "img/team/tolch.png",
        roleKey: 2,
        bioKey: 2
    }),
    new TeamMember({
        name: "Erebus Angelo",
        image: "img/team/erebus.png",
        roleKey: 3,
        bioKey: 3
    }),
    new TeamMember({
        name: "Nahuel Garcia",
        image: "img/team/nahuel.jpg",
        roleKey: 4,
        bioKey: 4
    }),
    new TeamMember({
        name: "Seb Zav",
        image: "img/team/sebas.jfif",
        roleKey: 5,
        bioKey: 5
    })
];

function getTeamRole(idx) {
    const lang = window.selectedLang || 'es';
    return dictionary[lang].team[idx].role;
}

function getTeamBio(idx) {
    const lang = window.selectedLang || 'es';
    return dictionary[lang].team[idx].bio;
}

function renderTeamGrid(selectedIdx = 0) {
    const grid = document.getElementById('team-grid');
    grid.innerHTML = '';
    teamMembers.forEach((member, idx) => {
        const div = document.createElement('div');
        div.className = 'team-member' + (idx === selectedIdx ? ' selected' : '');
        div.onclick = () => renderTeamSection(idx);
        div.innerHTML = `
            <div class="team-member-img-wrapper">
                <span class="team-member-img-border"></span>
                <img src="${member.image}" alt="${member.name}" class="team-member-img">
            </div>
            <div class="team-member-info">
                <div class="team-member-name">${member.name}</div>
                <div class="team-member-role">${getTeamRole(member.roleKey)}</div>
            </div>
        `;
        grid.appendChild(div);
    });
}

function renderTeamDetail(idx = 0) {
    const detail = document.getElementById('team-detail');
    const member = teamMembers[idx];
    detail.innerHTML = `
        <img src="${member.image}" alt="${member.name}" class="team-detail-img">
        <div class="team-detail-name">${member.name}</div>
        <div class="team-detail-role">${getTeamRole(member.roleKey)}</div>
        <div class="team-detail-bio">${getTeamBio(member.bioKey)}</div>
    `;
}

function renderTeamSection(selectedIdx = 0) {
    window.currentTeamSelected = selectedIdx;
    const detail = document.getElementById('team-detail');
    if (!detail) return;
    // Animar salida
    detail.classList.add('animating');
    setTimeout(() => {
        // Actualizar contenido
        const member = teamMembers[selectedIdx];
        detail.innerHTML = `
            <img src="${member.image}" alt="${member.name}" class="team-detail-img">
            <div class="team-detail-name">${member.name}</div>
            <div class="team-detail-role">${getTeamRole(member.roleKey)}</div>
            <div class="team-detail-bio">${getTeamBio(member.bioKey)}</div>
        `;
        // Animar entrada
        detail.classList.remove('animating');
    }, 350);
    renderTeamGrid(selectedIdx);
}
window.renderTeamSection = renderTeamSection;

document.addEventListener('DOMContentLoaded', () => {
    renderTeamSection(0);
});
