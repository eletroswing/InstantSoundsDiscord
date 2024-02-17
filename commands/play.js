const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a sound.")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Ex: E O PIX.")
        .setRequired(true)
        .setMaxLength(80)
    ),

  async execute(interaction, select) {
    let name;
    let id;
    let isSelect = false

    if(select) {
      if(select.id != `audio_select`) return
      isSelect = true;
      name = JSON.parse(select.value).name;
      id = JSON.parse(select.value).i;
    }else {
      name = interaction.options.get("name").value;
    }

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return await interaction.reply({ content: 'Você precisa estar em um canal de voz para reproduzir áudio.', ephemeral: true });
    }

    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
      return await interaction.reply({ content: 'Não tenho permissão para entrar e falar neste canal de voz.', ephemeral: true });
    }


    const res = await fetch(`https://luckyinstants.netlify.app/api/instants/search?q=${encodeURIComponent(name)}`);
    let resJson;

    if(isSelect) {
      await interaction.reply({ content: 'Tocando.', ephemeral: true });
      resJson = await res.json();

      const connection = joinVoiceChannel({
        channelId: interaction.member.voice.channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        selfDeaf: false
      });

      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Play,
        },
      });


      const resource = createAudioResource(resJson[id].audioUrl);
      player.play(resource);
      connection.subscribe(player);

      player.on('error', error => {
        console.error('Ocorreu um erro ao reproduzir o áudio:', error);
        connection.destroy();
      });

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });
      return
    }


    if (res.status == 404) {
      await interaction.reply({ content: 'Áudio requisitado não encontrado.', ephemeral: true });
      return;
    }

    resJson = await res.json();

    const options = resJson.slice(0, 10).map((result, index) => {
      return new StringSelectMenuOptionBuilder()
        .setLabel(`${index + 1}. ${result.title}`)
        .setDescription(`${result.audioUrl.replace(`https://www.myinstants.com/media/sounds/`, ``).slice(0, 100)}`)
        .setValue(`${JSON.stringify({i: index, name: name})}`)
    });


    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('audio_select')
      .setPlaceholder('Selecione o áudio.')
      .addOptions(...options);

    const row = new ActionRowBuilder()
      .addComponents(selectMenu);

    await interaction.reply({
      content: 'Escolha o áudio que deseja tocar!',
      ephemeral: true,
      components: [row],
    });
  }

};