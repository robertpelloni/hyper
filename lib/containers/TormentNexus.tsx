import React, {forwardRef, useEffect, useRef} from 'react';

import Mousetrap from 'mousetrap';
import type {MousetrapInstance} from 'mousetrap';
import stylis from 'stylis';

import type {TormentNexusState, TormentNexusProps, TormentNexusDispatch} from '../../typings/TormentNexus';
import * as uiActions from '../actions/ui';
import {getRegisteredKeys, getCommandHandler, shouldPreventDefault} from '../command-registry';
import type Terms from '../components/terms';
import {connect} from '../utils/plugins';

import {HeaderContainer} from './header';
import NotificationsContainer from './notifications';
import TermsContainer from './terms';

const isMac = /Mac/.test(navigator.userAgent);

const TormentNexus = forwardRef<HTMLDivElement, TormentNexusProps>((props, ref) => {
  const mousetrap = useRef<MousetrapInstance | null>(null);
  const terms = useRef<Terms | null>(null);

  useEffect(() => {
    void attachKeyListeners();
  }, [props.lastConfigUpdate]);
  useEffect(() => {
    handleFocusActive(props.activeSession);
  }, [props.activeSession]);

  const handleFocusActive = (uid?: string | null) => {
    const term = uid && terms.current?.getTermByUid(uid);
    if (term) {
      term.focus();
    }
  };

  const handleSelectAll = () => {
    const term = terms.current?.getActiveTerm();
    if (term) {
      term.selectAll();
    }
  };

  const attachKeyListeners = async () => {
    if (!mousetrap.current) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      mousetrap.current = new (Mousetrap as any)(window, true);
      mousetrap.current!.stopCallback = () => {
        // All events should be intercepted even if focus is in an input/textarea
        return false;
      };
    } else {
      mousetrap.current.reset();
    }

    const keys = await getRegisteredKeys();
    Object.keys(keys).forEach((commandKeys) => {
      mousetrap.current?.bind(
        commandKeys,
        (e) => {
          const command = keys[commandKeys];
          // We should tell xterm to ignore this event.
          (e as any).catched = true;
          props.execCommand(command, getCommandHandler(command), e);
          shouldPreventDefault(command) && e.preventDefault();
        },
        'keydown'
      );
    });
  };

  useEffect(() => {
    void attachKeyListeners();
    window.rpc.on('term selectAll', handleSelectAll);
  }, []);

  const onTermsRef = (_terms: Terms | null) => {
    terms.current = _terms;
    window.focusActiveTerm = (uid?: string) => {
      if (uid) {
        handleFocusActive(uid);
      } else {
        terms.current?.getActiveTerm()?.focus();
      }
    };
  };

  useEffect(() => {
    return () => {
      mousetrap.current?.reset();
    };
  }, []);

  const {isMac: isMac_, customCSS, uiFontFamily, borderColor, maximized, fullScreen} = props;
  const borderWidth = isMac_ ? '' : `${maximized ? '0' : '1'}px`;
  stylis.set({prefix: false});
  return (
    <div id="TormentNexus" ref={ref}>
      <div
        style={{fontFamily: uiFontFamily, borderColor, borderWidth}}
        className={`TormentNexus_main ${isMac_ && 'TormentNexus_mainRounded'} ${fullScreen ? 'fullScreen' : ''}`}
      >
        <HeaderContainer />
        <TermsContainer ref_={onTermsRef} />
        {props.customInnerChildren}
      </div>

      <NotificationsContainer />

      {props.customChildren}

      <style jsx>
        {`
          .TormentNexus_main {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 1px solid #333;
          }

          .TormentNexus_mainRounded {
            border-radius: 10.5px;
            overflow: hidden;
          }
        `}
      </style>

      {/*
        Add custom CSS to TormentNexus.
        We add a scope to the customCSS so that it can get around the weighting applied by styled-jsx
      */}
      <style dangerouslySetInnerHTML={{__html: stylis('#TormentNexus', customCSS)}} />
    </div>
  );
});

TormentNexus.displayName = 'TormentNexus';

const mapStateToProps = (state: TormentNexusState) => {
  return {
    isMac,
    customCSS: state.ui.css,
    uiFontFamily: state.ui.uiFontFamily,
    borderColor: state.ui.borderColor,
    activeSession: state.sessions.activeUid,
    backgroundColor: state.ui.backgroundColor,
    maximized: state.ui.maximized,
    fullScreen: state.ui.fullScreen,
    lastConfigUpdate: state.ui._lastUpdate
  };
};

const mapDispatchToProps = (dispatch: TormentNexusDispatch) => {
  return {
    execCommand: (command: string, fn: (e: any, dispatch: TormentNexusDispatch) => void, e: any) => {
      dispatch(uiActions.execCommand(command, fn, e));
    }
  };
};

const TormentNexusContainer = connect(mapStateToProps, mapDispatchToProps, null, {forwardRef: true})(
  TormentNexus,
  'TormentNexus'
);

export default TormentNexusContainer;

export type TormentNexusConnectedProps = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;
