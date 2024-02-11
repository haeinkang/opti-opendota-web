import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import { withRouter } from 'react-router-dom';
import Long from 'long';
import {
  getPlayer,
  getPlayerWinLoss,
  getProPlayers,
} from '../../actions';
import TabBar from '../TabBar';
import Spinner from '../Spinner';
import TableFilterForm from './TableFilterForm';
import PlayerHeader from './Header/PlayerHeader';
import PlayerProfilePrivate from './PlayerProfilePrivate';
// import Error from '../Error';
import playerPages from './playerPages';

class RequestLayer extends React.Component {
  static propTypes = {
    location: PropTypes.shape({
      key: PropTypes.string,
    }),
    match: PropTypes.shape({
      params: PropTypes.shape({
        playerId: PropTypes.string,
      }),
    }),
    history: PropTypes.shape({
      push: PropTypes.func,
    }),
    officialPlayerName: PropTypes.string,
    playerName: PropTypes.string,
    playerLoading: PropTypes.bool,
    strings: PropTypes.shape({}),
    proPlayerIds: PropTypes.arrayOf(PropTypes.number),
    isPlayerMatchHistoryDisabled: PropTypes.bool,
  }

  componentDidMount() {
    const { props } = this;
    const { playerId } = props.match.params;
    props.getPlayer(playerId);
    props.getPlayerWinLoss(playerId, props.location.search);
    props.getProPlayers();
  }

  componentDidUpdate(prevProps) {
    const { props } = this;
    const { playerId } = props.match.params;
    if (prevProps.match.params.playerId !== playerId) {
      props.getPlayer(playerId);
    }
    if (prevProps.location.key !== props.location.key) {
      props.getPlayerWinLoss(playerId, props.location.search);
    }
  }

  render() {
    const { location, match, strings, proPlayerIds, isPlayerMatchHistoryDisabled } = this.props;
    const { playerId } = this.props.match.params;
    const isProPlayer = proPlayerIds.filter((id) => playerId === id).length > 0;
    const isPlayerProfilePrivate = isPlayerMatchHistoryDisabled && !isProPlayer;

    if (Long.fromString(playerId).greaterThan('76561197960265728')) {
      this.props.history.push(`/players/${Long.fromString(playerId).subtract('76561197960265728')}`);
    }
    const info = match.params.info || 'overview';
    const page = playerPages(playerId, strings).find(_page => _page.key === info);
    const playerName = this.props.officialPlayerName || this.props.playerName || strings.general_anonymous;
    const title = page ? `${playerName} - ${page.name}` : playerName;
    return (
      <div>
        {!this.props.playerLoading && <Helmet title={title} />}
        <div>
          <PlayerHeader playerId={playerId} location={location} isPlayerProfilePrivate={isPlayerProfilePrivate} />
          <TabBar info={info} tabs={playerPages(playerId, strings, isPlayerProfilePrivate)} />
        </div>
        {isPlayerProfilePrivate ? (
          <PlayerProfilePrivate />
        ) : (
          <div>
            <TableFilterForm playerId={playerId} />
            {page ? page.content(playerId, match.params, location) : <Spinner />}
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  playerName: (state.app.player.data.profile || {}).personaname,
  playerLoading: (state.app.player.loading),
  officialPlayerName: (state.app.player.data.profile || {}).name,
  strings: state.app.strings,
  proPlayerIds: state.app.proPlayers.data.map((p) => p.account_id),
  isPlayerMatchHistoryDisabled: (state.app.player.data.profile || {}).fh_unavailable,
})

const mapDispatchToProps = dispatch => ({
  getPlayer: playerId => dispatch(getPlayer(playerId)),
  getPlayerWinLoss: (playerId, options) => dispatch(getPlayerWinLoss(playerId, options)),
  getProPlayers: () => dispatch(getProPlayers()),
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(RequestLayer));
